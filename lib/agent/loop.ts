import type { SarvamLLM, Msg, LLMToolCall } from "@/lib/agent/sarvam";
import { TOOL_SCHEMAS, runTool, type ToolContext } from "@/lib/agent/tools";
import { SYSTEM_PROMPT } from "@/lib/agent/prompts";
import { toBlocks, type Block } from "@/lib/agent/blocks";

const MAX_ITERATIONS = 6;
const FALLBACK_TEXT = "Sorry, I'm having trouble with that one — could you try rephrasing?";

export async function runAgentLoop(
  llm: SarvamLLM,
  history: Msg[],
  ctx: ToolContext
): Promise<{ assistantText: string; blocks: Block[] }> {
  const messages: Msg[] = [{ role: "system", content: SYSTEM_PROMPT }, ...history];
  const blocks: Block[] = [];

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const result = await llm.chat({ messages, tools: TOOL_SCHEMAS });

    if (!result.toolCalls || result.toolCalls.length === 0) {
      // A truncated/empty completion (e.g. the model's reasoning ate the whole token budget)
      // must never surface as a silent, un-repliable turn -- always give the user something.
      return { assistantText: result.text || FALLBACK_TEXT, blocks };
    }

    messages.push({
      role: "assistant",
      content: result.text ?? "",
      tool_calls: result.toolCalls.map((tc) => ({
        id: tc.id,
        type: "function",
        function: { name: tc.name, arguments: JSON.stringify(tc.args ?? {}) },
      })),
    });

    for (const call of result.toolCalls) {
      const toolResult = await runTool(call.name, call.args, ctx).catch((err: unknown) => ({
        error: err instanceof Error ? err.message : "Tool execution failed",
      }));

      blocks.push(...toBlocks(toolResult));
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        name: call.name,
        content: JSON.stringify(toolResult),
      });
    }
  }

  return { assistantText: FALLBACK_TEXT, blocks };
}

export type StreamChunk = { type: "text"; delta: string } | { type: "blocks"; blocks: Block[] };

/**
 * Same tool-calling loop, but streams text deltas as they arrive for whichever turn ends up
 * being the final (tool-call-free) reply. Intermediate turns that decide to call a tool aren't
 * shown to the user — there's nothing to display until the tool result comes back anyway — so
 * only their assembled text (if any) is kept for conversation history, not yielded.
 */
export async function* runAgentLoopStream(
  llm: SarvamLLM,
  history: Msg[],
  ctx: ToolContext
): AsyncGenerator<StreamChunk> {
  const messages: Msg[] = [{ role: "system", content: SYSTEM_PROMPT }, ...history];
  const blocks: Block[] = [];

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    let assembledText = "";
    let toolCalls: LLMToolCall[] | undefined;

    for await (const event of llm.chatStream({ messages, tools: TOOL_SCHEMAS })) {
      if (event.type === "text") {
        assembledText += event.delta;
        yield { type: "text", delta: event.delta };
      } else {
        toolCalls = event.toolCalls;
      }
    }

    if (!toolCalls || toolCalls.length === 0) {
      // Same truncation guard as runAgentLoop: if nothing streamed as text and no tool was
      // called, the turn produced nothing at all -- never leave the user with silence.
      if (!assembledText) yield { type: "text", delta: FALLBACK_TEXT };
      yield { type: "blocks", blocks };
      return;
    }

    messages.push({
      role: "assistant",
      content: assembledText,
      tool_calls: toolCalls.map((tc) => ({
        id: tc.id,
        type: "function",
        function: { name: tc.name, arguments: JSON.stringify(tc.args ?? {}) },
      })),
    });

    for (const call of toolCalls) {
      const toolResult = await runTool(call.name, call.args, ctx).catch((err: unknown) => ({
        error: err instanceof Error ? err.message : "Tool execution failed",
      }));

      blocks.push(...toBlocks(toolResult));
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        name: call.name,
        content: JSON.stringify(toolResult),
      });
    }
  }

  yield { type: "text", delta: FALLBACK_TEXT };
  yield { type: "blocks", blocks };
}
