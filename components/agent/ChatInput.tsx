"use client";

import { useEffect, useState } from "react";
import { Ear, EarOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { VoiceButton } from "@/components/agent/VoiceButton";
import { useAutoVoiceCapture } from "@/lib/agent/useAutoVoiceCapture";
import { cn } from "@/lib/utils";

export function ChatInput({
  onSend,
  onSendVoice,
  disabled,
  isProcessingVoice,
}: {
  onSend: (text: string) => void;
  onSendVoice: (audioBlob: Blob) => void;
  disabled?: boolean;
  isProcessingVoice?: boolean;
}) {
  const [value, setValue] = useState("");
  const autoVoice = useAutoVoiceCapture(onSendVoice, !!disabled || !!isProcessingVoice);
  const autoListening = autoVoice.state !== "off";

  // Stop the mic stream if the panel/component unmounts while auto-listen is on.
  useEffect(() => () => autoVoice.stop(), [autoVoice.stop]);

  return (
    <form
      className="flex gap-2 border-t border-border bg-white p-3"
      onSubmit={(e) => {
        e.preventDefault();
        const text = value.trim();
        if (!text) return;
        onSend(text);
        setValue("");
      }}
    >
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Ask Venmathi..."
        // Not disabled while pending: a disabled input loses focus the instant it's set (the
        // browser blurs it for you), which kicked the user out of the box after every send.
        // Submission is still blocked below via the Send button's disabled state.
        aria-label="Message Venmathi"
        // Safe here specifically because ChatInput only ever mounts when the panel opens
        // (conditionally rendered in AgentSidebar, not just hidden) -- so this fires exactly
        // once per open, matching the WCAG dialog pattern of moving focus in on open.
        autoFocus
      />
      <button
        type="button"
        onClick={() => (autoListening ? autoVoice.stop() : autoVoice.start())}
        disabled={disabled}
        aria-label={autoListening ? "Stop always-listening mode" : "Start always-listening mode"}
        aria-pressed={autoListening}
        title={autoVoice.error ?? (autoListening ? "Listening — talk any time" : "Start always-listening")}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-md border",
          autoVoice.state === "capturing"
            ? "animate-pulse border-red-500 bg-red-500 text-white"
            : autoListening
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted hover:bg-black/5"
        )}
      >
        {autoListening ? <Ear className="h-5 w-5" /> : <EarOff className="h-5 w-5" />}
      </button>
      {!autoListening && <VoiceButton onAudioCaptured={onSendVoice} isProcessing={!!isProcessingVoice} disabled={disabled} />}
      <Button type="submit" disabled={disabled || !value.trim()}>
        Send
      </Button>
    </form>
  );
}
