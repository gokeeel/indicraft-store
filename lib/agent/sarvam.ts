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

export interface SarvamLLM {
  chat(input: { messages: Msg[]; tools: ToolSchema[]; signal?: AbortSignal }): Promise<{
    text?: string;
    toolCalls?: LLMToolCall[];
  }>;
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
}

async function fetchWithRetry(url: string, init: RequestInit, outerSignal?: AbortSignal, attempt = 0): Promise<Response> {
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  outerSignal?.addEventListener("abort", onAbort);
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
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
    const lastMessage = messages[messages.length - 1];

    // A tool result just came back — give a short scripted reply instead of looping again.
    if (lastMessage?.role === "tool") {
      return { text: "Semma! Here's what I found. Want to see more or narrow it down?" };
    }

    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const text = (lastUser?.content ?? "").toLowerCase();

    const priceMatch = text.match(/(\d{3,6})/);
    const maxPrice = priceMatch ? Number(priceMatch[1]) : undefined;

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
