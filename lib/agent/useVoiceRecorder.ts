"use client";

import { useCallback, useRef, useState } from "react";

const MAX_DURATION_S = 30;

export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopResolveRef = useRef<((blob: Blob) => void) | null>(null);

  const stopRecording = useCallback((): Promise<Blob> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        resolve(new Blob());
        return;
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      stopResolveRef.current = resolve;
      recorder.stop();
    });
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
      });

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/mp4";
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        mediaRecorder.stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);
        stopResolveRef.current?.(blob);
        stopResolveRef.current = null;
      };

      mediaRecorder.start(100);
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setDuration(0);

      let elapsed = 0;
      timerRef.current = setInterval(() => {
        elapsed++;
        setDuration(elapsed);
        if (elapsed >= MAX_DURATION_S) stopRecording();
      }, 1000);
    } catch (err) {
      setError(
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Microphone permission denied. Please allow access in your browser settings."
          : "Could not access microphone."
      );
    }
  }, [stopRecording]);

  return { isRecording, duration, startRecording, stopRecording, error };
}
