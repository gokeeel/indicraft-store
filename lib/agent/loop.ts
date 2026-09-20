import type { SarvamLLM, Msg } from "@/lib/agent/sarvam";
import { TOOL_SCHEMAS, runTool, type ToolContext } from "@/lib/agent/tools";
import { SYSTEM_PROMPT } from "@/lib/agent/prompts";
import { toBlocks, type Block } from "@/lib/agent/blocks";

const MAX_ITERATIONS = 6;

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
      return { assistantText: result.text ?? "", blocks };
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

      blocks.push(...toBlocks(call.name, toolResult));
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        name: call.name,
        content: JSON.stringify(toolResult),
      });
    }
  }

  return {
    assistantText: "Sorry, I'm having trouble with that one — could you try rephrasing?",
    blocks,
  };
}
