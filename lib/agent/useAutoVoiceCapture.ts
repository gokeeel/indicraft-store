"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Lightweight amplitude-threshold VAD instead of a full ML model (e.g. @ricky0123/vad-web) --
// no WASM/model download, no extra dependency, good enough to tell "someone is talking" from
// "silence" for a shopping-assistant demo. A real always-listening product would want a proper
// VAD model to reject background noise; this is the pragmatic version for the 3-day timeline.
const SPEECH_RMS_THRESHOLD = 0.03;
const SPEECH_ONSET_MS = 250;
const SILENCE_TO_STOP_MS = 1200;
const MAX_SEGMENT_MS = 20_000;

export type AutoVoiceState = "off" | "idle" | "capturing";

export function useAutoVoiceCapture(onSegment: (blob: Blob) => void, paused: boolean) {
  const [state, setState] = useState<AutoVoiceState>("off");
  const [error, setError] = useState<string | null>(null);
  // Live 0-1ish input level, for a visual (e.g. an orb) to react to while listening/capturing.
  const [amplitude, setAmplitude] = useState(0);

  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const segmentTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onsetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  const stopSegment = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (segmentTimeoutRef.current) clearTimeout(segmentTimeoutRef.current);
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
    recorderRef.current = null;
    setState((s) => (s === "capturing" ? "idle" : s));
  }, []);

  const beginSegment = useCallback(() => {
    const stream = streamRef.current;
    if (!stream || recorderRef.current) return;
    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/mp4";
    const recorder = new MediaRecorder(stream, { mimeType });
    chunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      if (blob.size > 0) onSegment(blob);
    };
    recorder.start(100);
    recorderRef.current = recorder;
    setState("capturing");
    segmentTimeoutRef.current = setTimeout(stopSegment, MAX_SEGMENT_MS);
  }, [onSegment, stopSegment]);

  const tick = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const data = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(data);
    let sumSquares = 0;
    for (const sample of data) {
      const normalized = (sample - 128) / 128;
      sumSquares += normalized * normalized;
    }
    const rms = Math.sqrt(sumSquares / data.length);
    // Scaled for a punchier visual than raw RMS gives (speech rarely exceeds ~0.15 RMS on a
    // typical mic), clamped to 1.
    setAmplitude(Math.min(1, rms / 0.15));

    if (pausedRef.current) {
      // Parent disabled input (e.g. a previous turn is still processing) mid-capture -- stop
      // instead of leaving the recorder running with nothing watching for silence.
      if (onsetTimerRef.current) {
        clearTimeout(onsetTimerRef.current);
        onsetTimerRef.current = null;
      }
      if (recorderRef.current) stopSegment();
    } else if (rms > SPEECH_RMS_THRESHOLD) {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      // Require the loud sound to hold for SPEECH_ONSET_MS before actually starting to record --
      // a brief noise spike (a knock, a click, a cough) shouldn't open a mic capture and get sent
      // off to STT, which tends to hallucinate a "transcript" out of non-speech audio.
      if (!recorderRef.current && !onsetTimerRef.current) {
        onsetTimerRef.current = setTimeout(() => {
          onsetTimerRef.current = null;
          beginSegment();
        }, SPEECH_ONSET_MS);
      }
    } else {
      if (onsetTimerRef.current) {
        clearTimeout(onsetTimerRef.current);
        onsetTimerRef.current = null;
      }
      if (recorderRef.current && !silenceTimerRef.current) {
        silenceTimerRef.current = setTimeout(() => {
          silenceTimerRef.current = null;
          stopSegment();
        }, SILENCE_TO_STOP_MS);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
  }, [beginSegment, stopSegment]);

  const start = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;
      const AudioContextClass = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      setState("idle");
      rafRef.current = requestAnimationFrame(tick);
    } catch (err) {
      setError(
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Microphone permission denied. Please allow access in your browser settings."
          : "Could not access microphone."
      );
      setState("off");
    }
  }, [tick]);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (segmentTimeoutRef.current) clearTimeout(segmentTimeoutRef.current);
    if (onsetTimerRef.current) clearTimeout(onsetTimerRef.current);
    recorderRef.current?.stop();
    recorderRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    analyserRef.current = null;
    setState("off");
    setAmplitude(0);
  }, []);

  useEffect(() => stop, [stop]);

  return { state, error, amplitude, start, stop };
}
