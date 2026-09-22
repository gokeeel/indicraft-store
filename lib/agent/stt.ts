import { fetchWithRetry } from "@/lib/agent/sarvam";

const SARVAM_BASE_URL = "https://api.sarvam.ai";

export type SttResult = { transcript: string; languageCode?: string };

const EXTENSION_BY_MIME: Record<string, string> = {
  "audio/webm": "webm",
  "audio/mp4": "mp4",
  "audio/wav": "wav",
  "audio/mpeg": "mp3",
};

/** Speech-to-text via Sarvam's saaras:v3. Language is auto-detected — Tamil, English, and
 *  Tanglish all come back as a single transcript with whatever mix the speaker used. */
export async function transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<SttResult> {
  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) throw new Error("SARVAM_API_KEY not set");

  const ext = EXTENSION_BY_MIME[mimeType.split(";")[0]] ?? "webm";
  // Sarvam's STT only accepts a fixed MIME allowlist (mpeg/wav/aac/aiff/octet-stream, notably
  // NOT webm — despite the browser's MediaRecorder producing audio/webm;codecs=opus by default).
  // application/octet-stream is on that allowlist and lets Sarvam sniff the real format instead.
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(audioBuffer)], { type: "application/octet-stream" }), `audio.${ext}`);
  form.append("model", "saaras:v3");

  const res = await fetchWithRetry(`${SARVAM_BASE_URL}/speech-to-text`, {
    method: "POST",
    headers: { "api-subscription-key": apiKey },
    body: form,
  });

  const data = (await res.json()) as { transcript?: string; language_code?: string };
  return { transcript: (data.transcript ?? "").trim(), languageCode: data.language_code };
}
