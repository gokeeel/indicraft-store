"use client";

import { Mic, Square, Loader2 } from "lucide-react";
import { useVoiceRecorder } from "@/lib/agent/useVoiceRecorder";
import { cn } from "@/lib/utils";

export function VoiceButton({
  onAudioCaptured,
  isProcessing,
  disabled,
}: {
  onAudioCaptured: (blob: Blob) => void;
  isProcessing: boolean;
  disabled?: boolean;
}) {
  const { isRecording, duration, startRecording, stopRecording, error } = useVoiceRecorder();

  async function handleClick() {
    if (isRecording) {
      const blob = await stopRecording();
      if (blob.size > 0) onAudioCaptured(blob);
      return;
    }
    await startRecording();
  }

  if (isProcessing) {
    return (
      <button type="button" disabled className="flex h-9 w-9 items-center justify-center rounded-md text-muted">
        <Loader2 className="h-5 w-5 animate-spin" />
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        aria-label={isRecording ? "Stop recording" : "Record a voice message"}
        aria-pressed={isRecording}
        title={error ?? undefined}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-md border",
          isRecording
            ? "animate-pulse border-red-500 bg-red-500 text-white"
            : "border-border text-muted hover:bg-black/5"
        )}
      >
        {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-5 w-5" />}
      </button>
      {isRecording && (
        <span className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-red-600">
          {duration}s
        </span>
      )}
      {error && !isRecording && (
        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] text-red-600">
          {error}
        </span>
      )}
    </div>
  );
}
