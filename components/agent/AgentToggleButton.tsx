"use client";

import { Sparkles } from "lucide-react";
import { useAgentPanel } from "@/lib/agent/context";

export function AgentToggleButton() {
  const { toggle } = useAgentPanel();
  return (
    <button
      type="button"
      onClick={toggle}
      className="hidden items-center gap-1.5 rounded-full border border-primary px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 md:flex"
      aria-label="Ask Venmathi"
    >
      <Sparkles className="h-4 w-4" />
      Ask Venmathi
    </button>
  );
}
