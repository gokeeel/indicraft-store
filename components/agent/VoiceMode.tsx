"use client";

import { X } from "lucide-react";
import type { AutoVoiceState } from "@/lib/agent/useAutoVoiceCapture";
import { BlockRenderer } from "@/components/agent/BlockRenderer";
import type { Block } from "@/lib/agent/blocks";

// The full-panel "talk to it" experience -- a reactive orb plus captions up top, and whatever
// the last turn's cards were (products, address, order summary, payment link) below it. Voice
// carries the conversation, but confirming an item, an address, or a real order still needs
// something on screen to look at and, for cart/order actions, actually tap -- a voice-only user
// can't act on a product card or an order total they never saw.
export function VoiceMode({
  state,
  amplitude,
  error,
  processing,
  isSpeaking,
  lastUserLine,
  lastAssistantLine,
  blocks,
  onExit,
  onQuickReply,
  onAddToCart,
  onSelectAddress,
  onRequestNewAddress,
  onConfirmOrder,
}: {
  state: AutoVoiceState;
  amplitude: number;
  error: string | null;
  processing: boolean;
  isSpeaking: boolean;
  lastUserLine: string | null;
  lastAssistantLine: string | null;
  blocks: Block[];
  onExit: () => void;
  onQuickReply: (value: string) => void;
  onAddToCart: (productId: string) => void;
  onSelectAddress: (addressId: string) => void;
  onRequestNewAddress: () => void;
  onConfirmOrder: (confirmToken: string) => Promise<void>;
}) {
  const label = error
    ? "Microphone unavailable"
    : processing
      ? "Thinking…"
      : isSpeaking
        ? "Speaking…"
        : state === "capturing"
          ? "Listening…"
          : state === "idle"
            ? "Go ahead, I'm listening"
            : "Starting…";

  // Idle/capturing: the orb reacts to real mic input. Processing/speaking: no input signal
  // matters, so a slow scripted breathing animation carries the "still active" feel instead.
  const reactive = state !== "off" && !processing && !isSpeaking && !error;
  const scale = reactive ? 1 + amplitude * 0.35 : 1;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex flex-col items-center gap-3 px-6 pb-4 pt-6">
        <button
          type="button"
          onClick={onExit}
          aria-label="End voice conversation"
          className="absolute right-4 top-[4.5rem] rounded-full p-2 text-muted hover:bg-black/5"
        >
          <X className="h-5 w-5" />
        </button>

        <div
          className={
            "flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary to-orange-400 shadow-[0_0_40px_-8px] shadow-primary/50 transition-transform duration-100 " +
            (!reactive && (processing || isSpeaking) ? "animate-pulse" : "")
          }
          style={{ transform: `scale(${scale})` }}
        >
          <div className="h-full w-full rounded-full bg-white/10" />
        </div>

        <p className="text-sm font-medium">{label}</p>

        {error && (
          <p className="max-w-xs text-center text-xs text-red-600">
            {error} You can close this and use the mic or text box instead.
          </p>
        )}

        {!error && (lastUserLine || lastAssistantLine) && (
          <div className="max-w-xs space-y-1 text-center text-xs text-muted">
            {lastUserLine && <p>&ldquo;{lastUserLine}&rdquo;</p>}
            {lastAssistantLine && <p className="text-foreground">{lastAssistantLine}</p>}
          </div>
        )}
      </div>

      {blocks.length > 0 && (
        <div className="flex-1 space-y-2 overflow-y-auto border-t border-border bg-white/60 px-4 py-3">
          {blocks.map((block, i) => (
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

      <button
        type="button"
        onClick={onExit}
        className="border-t border-border py-3 text-center text-sm font-medium text-primary hover:underline"
      >
        End conversation
      </button>
    </div>
  );
}
