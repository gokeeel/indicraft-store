export type Msg = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_call_id?: string;
  name?: string;
  tool_calls?: { id: string; type: "function"; function: { name: string; arguments: string } }[];
};

export type ToolSchema = {
  type: "function";
  function: { name: string; description: string; parameters: Record<string, unknown> };
};

export type LLMToolCall = { id: string; name: string; args: unknown };

export type StreamEvent = { type: "text"; delta: string } | { type: "tool_calls"; toolCalls: LLMToolCall[] };

export interface SarvamLLM {
  chat(input: { messages: Msg[]; tools: ToolSchema[]; signal?: AbortSignal }): Promise<{
    text?: string;
    toolCalls?: LLMToolCall[];
  }>;
  /** Same call, but yields text deltas as they arrive; ends with a tool_calls event
   *  instead if the model decided to call a tool rather than reply with text. */
  chatStream(input: { messages: Msg[]; tools: ToolSchema[]; signal?: AbortSignal }): AsyncGenerator<StreamEvent>;
}

const SARVAM_BASE_URL = "https://api.sarvam.ai";
const REQUEST_TIMEOUT_MS = 30_000;

export class SarvamHttpLLM implements SarvamLLM {
  constructor(
    private apiKey: string,
    private model: string = process.env.SARVAM_MODEL || "sarvam-105b"
  ) {}

  async chat({ messages, tools, signal }: { messages: Msg[]; tools: ToolSchema[]; signal?: AbortSignal }) {
    const res = await fetchWithRetry(
      `${SARVAM_BASE_URL}/v1/chat/completions`,
      {
        method: "POST",
        headers: { "api-subscription-key": this.apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.model,
          messages,
          tools,
          tool_choice: "auto",
          max_tokens: 600,
          temperature: 0.3,
        }),
      },
      signal
    );

    const data = await res.json();
    const choice = data.choices?.[0]?.message;
    if (!choice) throw new Error("Sarvam: response had no choices");

    const toolCalls = choice.tool_calls?.map((tc: { id: string; function: { name: string; arguments: string } }) => ({
      id: tc.id,
      name: tc.function.name,
      args: safeJsonParse(tc.function.arguments),
    }));

    return { text: choice.content ?? undefined, toolCalls };
  }

  async *chatStream({
    messages,
    tools,
    signal,
  }: {
    messages: Msg[];
    tools: ToolSchema[];
    signal?: AbortSignal;
  }): AsyncGenerator<StreamEvent> {
    const res = await fetchWithRetry(
      `${SARVAM_BASE_URL}/v1/chat/completions`,
      {
        method: "POST",
        headers: { "api-subscription-key": this.apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.model,
          messages,
          tools,
          tool_choice: "auto",
          max_tokens: 600,
          temperature: 0.3,
          stream: true,
        }),
      },
      signal
    );

    if (!res.body) throw new Error("Sarvam: streaming response had no body");

    // OpenAI-compatible SSE: lines of "data: {...}", ending in "data: [DONE]". Tool call
    // arguments arrive as string fragments per index and must be concatenated across chunks.
    const toolCallBuffers = new Map<number, { id?: string; name?: string; args: string }>();
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      outer: while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const payload = trimmed.slice(5).trim();
          // Sarvam may keep the connection open briefly after the final chunk; stop reading
          // as soon as we see the sentinel instead of waiting on reader.read() to resolve done.
          if (payload === "[DONE]") break outer;

          const chunk = safeJsonParse(payload) as {
            choices?: [{ delta?: { content?: string; tool_calls?: DeltaToolCall[] } }];
          };
          const delta = chunk.choices?.[0]?.delta;
          if (!delta) continue;

          if (delta.content) yield { type: "text", delta: delta.content };

          for (const tc of delta.tool_calls ?? []) {
            const existing = toolCallBuffers.get(tc.index) ?? { args: "" };
            if (tc.id) existing.id = tc.id;
            if (tc.function?.name) existing.name = (existing.name ?? "") + tc.function.name;
            if (tc.function?.arguments) existing.args += tc.function.arguments;
            toolCallBuffers.set(tc.index, existing);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    if (toolCallBuffers.size > 0) {
      const toolCalls = [...toolCallBuffers.entries()]
        .sort(([a], [b]) => a - b)
        .map(([, tc]) => ({
          id: tc.id ?? `call-${crypto.randomUUID()}`,
          name: tc.name ?? "",
          args: safeJsonParse(tc.args),
        }));
      yield { type: "tool_calls", toolCalls };
    }
  }
}

type DeltaToolCall = { index: number; id?: string; function?: { name?: string; arguments?: string } };

async function fetchWithRetry(url: string, init: RequestInit, outerSignal?: AbortSignal, attempt = 0): Promise<Response> {
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  outerSignal?.addEventListener("abort", onAbort);
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    let res: Response;
    try {
      res = await fetch(url, { ...init, signal: controller.signal });
    } catch (err) {
      // Network-level failure (DNS, connect timeout, reset) — fetch throws before any
      // Response exists, so this needs its own retry path distinct from HTTP error codes below.
      if (attempt === 0 && !outerSignal?.aborted) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return fetchWithRetry(url, init, outerSignal, attempt + 1);
      }
      throw err;
    }

    if (!res.ok && (res.status === 429 || res.status >= 500) && attempt === 0) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return fetchWithRetry(url, init, outerSignal, attempt + 1);
    }
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Sarvam API error ${res.status}: ${body.slice(0, 300)}`);
    }
    return res;
  } finally {
    clearTimeout(timeout);
    outerSignal?.removeEventListener("abort", onAbort);
  }
}

function safeJsonParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * Deterministic, scripted LLM for tests and offline development — no network,
 * no credits spent. Recognizes a couple of shopping intents by keyword.
 */
export class MockLLM implements SarvamLLM {
  async chat({ messages }: { messages: Msg[]; tools: ToolSchema[] }) {
    return this.decide(messages);
  }

  async *chatStream({ messages }: { messages: Msg[]; tools: ToolSchema[] }): AsyncGenerator<StreamEvent> {
    const result = this.decide(messages);
    if (result.toolCalls) {
      yield { type: "tool_calls", toolCalls: result.toolCalls };
      return;
    }
    // Simulate token-by-token arrival so the UI's streaming path is exercised in dev too.
    const words = (result.text ?? "").split(" ");
    for (const word of words) {
      yield { type: "text", delta: word + " " };
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
  }

  private decide(messages: Msg[]): { text?: string; toolCalls?: LLMToolCall[] } {
    const lastMessage = messages[messages.length - 1];

    // A tool result just came back — give a short scripted reply instead of looping again.
    if (lastMessage?.role === "tool") {
      if (lastMessage.name === "ask_user") return { text: "Take your pick!" };
      if (lastMessage.name === "add_to_cart") return { text: "Added it to your cart! Want to keep browsing or checkout?" };
      if (lastMessage.name === "remove_cart_item") return { text: "Removed. Here's your cart now." };
      if (lastMessage.name === "update_cart_item") return { text: "Updated the quantity for you." };
      if (lastMessage.name === "view_cart") return { text: "Here's what's in your cart right now." };
      if (lastMessage.name === "list_addresses") return { text: "Pick an address to ship to, or add a new one." };
      if (lastMessage.name === "request_new_address") return { text: "Sure, add your address below." };
      if (lastMessage.name === "preview_order") return { text: "Here's your order total!" };
      return { text: "Semma! Here's what I found. Want to see more or narrow it down?" };
    }

    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const text = (lastUser?.content ?? "").toLowerCase();

    const priceMatch = text.match(/(\d{3,6})/);
    const maxPrice = priceMatch ? Number(priceMatch[1]) : undefined;

    if (/checkout|address/.test(text)) {
      return { toolCalls: [{ id: "mock-1", name: "list_addresses", args: {} }] };
    }
    if (/cart/.test(text)) {
      return { toolCalls: [{ id: "mock-1", name: "view_cart", args: {} }] };
    }
    if (/gift|surprise|something nice|recommend/.test(text)) {
      return {
        toolCalls: [
          {
            id: "mock-1",
            name: "ask_user",
            args: { question: "What's your budget?", options: ["Under ₹1000", "₹1000-2500", "₹2500+"] },
          },
        ],
      };
    }
    if (/saree|dupatta|fabric|scarf|stole/.test(text)) {
      return {
        toolCalls: [
          { id: "mock-1", name: "search_products", args: { category: "fabric", maxPrice } },
        ],
      };
    }
    if (/show|search|find|looking for|browse/.test(text)) {
      return {
        toolCalls: [{ id: "mock-1", name: "search_products", args: { query: text, maxPrice } }],
      };
    }

    return {
      text: "Hi, I'm Venmathi! Tell me what you're looking for — a saree, home decor, spices — and I'll find it for you.",
    };
  }
}

export function getLLM(): SarvamLLM {
  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) {
    console.warn("[agent] SARVAM_API_KEY not set — using MockLLM");
    return new MockLLM();
  }
  return new SarvamHttpLLM(apiKey);
}
