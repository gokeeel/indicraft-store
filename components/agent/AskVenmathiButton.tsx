"use client";

import { Sparkles } from "lucide-react";
import { useAgentPanel } from "@/lib/agent/context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AskVenmathiButton({
  prompt,
  children,
  variant = "outline",
  className,
}: {
  prompt?: string;
  children: React.ReactNode;
  variant?: "default" | "outline" | "ghost";
  className?: string;
}) {
  const { askVenmathi, toggle } = useAgentPanel();
  return (
    <Button
      type="button"
      variant={variant}
      onClick={() => (prompt ? askVenmathi(prompt) : toggle())}
      className={cn("gap-1.5", className)}
    >
      <Sparkles className="h-4 w-4" />
      {children}
    </Button>
  );
}
