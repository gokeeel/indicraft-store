import type { Block } from "@/lib/agent/blocks";

export type ChatEntry =
  | { id: string; role: "user"; content: string }
  // audio: base64 mp3 from Venmathi's TTS, present only on voice-triggered replies.
  | { id: string; role: "assistant"; content: string; blocks: Block[]; audio?: string };
