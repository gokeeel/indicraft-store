import { fetchWithRetry } from "@/lib/agent/sarvam";

const SARVAM_BASE_URL = "https://api.sarvam.ai";
const MAX_TTS_CHARS = 2500;

export type TtsResult = { audioBase64: string };

/** STT language codes map straight onto TTS ones; anything unrecognized (or Tanglish, which
 *  can come back tagged either way) falls back to Indian English — bulbul:v3 speaks code-mixed
 *  text naturally regardless of the target language tag. */
export function getTTSLanguageCode(sttLanguageCode?: string): string {
  const known = new Set(["ta-IN", "en-IN", "hi-IN"]);
  if (sttLanguageCode && known.has(sttLanguageCode)) return sttLanguageCode;
  if (sttLanguageCode === "en-US") return "en-IN";
  return "en-IN";
}

export function preprocessForTTS(text: string): string {
  let clean = text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`(.*?)`/g, "$1")
    .replace(/#{1,6}\s/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/₹([\d,]+)/g, (_, price: string) => `${price.replace(/,/g, "")} rupees`);

  if (clean.length > MAX_TTS_CHARS) clean = clean.slice(0, MAX_TTS_CHARS - 3) + "...";
  return clean;
}

/** Text-to-speech via Sarvam's bulbul:v3, in Venmathi's voice. */
export async function synthesizeSpeech(text: string, sttLanguageCode?: string): Promise<TtsResult> {
  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) throw new Error("SARVAM_API_KEY not set");

  const res = await fetchWithRetry(`${SARVAM_BASE_URL}/text-to-speech`, {
    method: "POST",
    headers: { "api-subscription-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      text: preprocessForTTS(text),
      target_language_code: getTTSLanguageCode(sttLanguageCode),
      model: "bulbul:v3",
      speaker: process.env.VENMATHI_TTS_SPEAKER || "priya",
      speech_sample_rate: 24000,
      pace: 1.0,
      output_audio_codec: "mp3",
    }),
  });

  const data = (await res.json()) as { audios?: string[] };
  const audio = data.audios?.[0];
  if (!audio) throw new Error("Sarvam TTS: response had no audio");
  return { audioBase64: audio };
}
