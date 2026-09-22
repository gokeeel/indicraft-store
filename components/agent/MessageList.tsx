"use client";

import { useEffect, useRef } from "react";
import { Volume2 } from "lucide-react";
import { BlockRenderer } from "@/components/agent/BlockRenderer";
import { TypingIndicator } from "@/components/agent/TypingIndicator";
import { cn } from "@/lib/utils";
import type { ChatEntry } from "@/lib/agent/client-types";

function playAudio(base64: string) {
  new Audio(`data:audio/mp3;base64,${base64}`).play().catch(() => {
    // Autoplay blocked or playback failed — the "Play again" button lets the user retry.
  });
}

export function MessageList({
  entries,
  pending,
  onQuickReply,
  onAddToCart,
  onSelectAddress,
  onRequestNewAddress,
  onConfirmOrder,
}: {
  entries: ChatEntry[];
  pending: boolean;
  onQuickReply: (value: string) => void;
  onAddToCart: (productId: string) => void;
  onSelectAddress: (addressId: string) => void;
  onRequestNewAddress: () => void;
  onConfirmOrder: (confirmToken: string) => Promise<void>;
}) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries, pending]);

  return (
    // overscroll-contain stops scroll chaining: without it, scrolling past this panel's own
    // top/bottom hands the gesture to the page behind it, so the storefront scrolls too.
    <div className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4" aria-live="polite">
      {entries.map((entry) => (
        <div key={entry.id} className={cn("flex", entry.role === "user" ? "justify-end" : "justify-start")}>
          {entry.role === "user" ? (
            <div className="max-w-[85%] rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground">
              {entry.content}
            </div>
          ) : (
            <div className="max-w-[92%]">
              {entry.content && (
                <div className="flex items-start gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm">
                  <span className="flex-1">{entry.content}</span>
                  {entry.audio && (
                    <button
                      type="button"
                      onClick={() => playAudio(entry.audio!)}
                      aria-label="Play Venmathi's voice reply again"
                      className="shrink-0 text-muted hover:text-foreground"
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
              {entry.blocks.map((block, i) => (
                <BlockRenderer
                  key={i}
                  block={block}
                  onQuickReply={onQuickReply}
                  onAddToCart={onAddToCart}
                  onSelectAddress={onSelectAddress}
                  onRequestNewAddress={onRequestNewAddress}
                  onConfirmOrder={onConfirmOrder}
                />
              ))}
            </div>
          )}
        </div>
      ))}
      {pending && <TypingIndicator />}
      <div ref={endRef} />
    </div>
  );
}
