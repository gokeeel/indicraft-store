import type { Block } from "@/lib/agent/blocks";

export type ChatEntry =
  | { id: string; role: "user"; content: string }
  | { id: string; role: "assistant"; content: string; blocks: Block[] };
