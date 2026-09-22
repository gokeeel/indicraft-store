"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { VoiceButton } from "@/components/agent/VoiceButton";

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
      />
      <VoiceButton onAudioCaptured={onSendVoice} isProcessing={!!isProcessingVoice} disabled={disabled} />
      <Button type="submit" disabled={disabled || !value.trim()}>
        Send
      </Button>
    </form>
  );
}
