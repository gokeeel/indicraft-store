"use client";

import { X } from "lucide-react";
import type { AutoVoiceState } from "@/lib/agent/useAutoVoiceCapture";

// The full-panel "talk to it" experience -- a big reactive orb and a status line, not a chat
// log with a mic icon bolted on. Minimal text by design: the orb IS the interface while this
// is open, captions are just enough context to follow along, not something to read instead.
export function VoiceMode({
  state,
  amplitude,
  error,
  processing,
  isSpeaking,
  lastUserLine,
  lastAssistantLine,
  onExit,
}: {
  state: AutoVoiceState;
  amplitude: number;
  error: string | null;
  processing: boolean;
  isSpeaking: boolean;
  lastUserLine: string | null;
  lastAssistantLine: string | null;
  onExit: () => void;
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
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-8">
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
          "flex h-44 w-44 items-center justify-center rounded-full bg-gradient-to-br from-primary to-orange-400 shadow-[0_0_60px_-5px] shadow-primary/50 transition-transform duration-100 " +
          (!reactive && (processing || isSpeaking) ? "animate-pulse" : "")
        }
        style={{ transform: `scale(${scale})` }}
      >
        <div className="h-full w-full rounded-full bg-white/10" />
      </div>

      <p className="text-base font-medium">{label}</p>

      {error && (
        <p className="max-w-xs text-center text-sm text-red-600">
          {error} You can close this and use the mic or text box instead.
        </p>
      )}

      {!error && (lastUserLine || lastAssistantLine) && (
        <div className="max-w-xs space-y-1 text-center text-sm text-muted">
          {lastUserLine && <p>&ldquo;{lastUserLine}&rdquo;</p>}
          {lastAssistantLine && <p className="text-foreground">{lastAssistantLine}</p>}
        </div>
      )}

      <button type="button" onClick={onExit} className="text-sm font-medium text-primary hover:underline">
        End conversation
      </button>
    </div>
  );
}
