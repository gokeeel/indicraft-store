/**
 * Phase 1 acceptance check: TTS produces audible speech, and feeding that same audio back
 * through STT round-trips to a transcript that's actually there (no test audio files needed —
 * we synthesize our own fixtures).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { synthesizeSpeech } from "../lib/agent/tts";
import { transcribeAudio } from "../lib/agent/stt";

// tsx doesn't auto-load .env.local the way `next dev` does — load it manually.
function loadEnvLocal() {
  try {
    const raw = readFileSync(join(__dirname, "..", ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].trim().replace(/^"|"$/g, "");
      }
    }
  } catch {
    // no .env.local
  }
}
loadEnvLocal();

const samples: { label: string; text: string; lang: string }[] = [
  { label: "english", text: "Here is a lovely blue saree for one thousand eight hundred fifty rupees.", lang: "en-IN" },
  { label: "tamil", text: "உங்களுக்கு ஒரு அழகான சேலை கிடைக்கும்.", lang: "ta-IN" },
  { label: "tanglish", text: "Oru blue saree irukku, cart la add pannava?", lang: "ta-IN" },
];

async function main() {
  for (const sample of samples) {
    console.log(`\n--- ${sample.label} ---`);
    console.log(`TTS input: "${sample.text}"`);

    const tts = await synthesizeSpeech(sample.text, sample.lang);
    const audioBuffer = Buffer.from(tts.audioBase64, "base64");
    const outPath = join(tmpdir(), `voice-test-${sample.label}.mp3`);
    writeFileSync(outPath, audioBuffer);
    console.log(`TTS produced ${audioBuffer.length} bytes -> ${outPath}`);
    if (audioBuffer.length < 1000) throw new Error("FAIL: audio suspiciously small");

    const stt = await transcribeAudio(audioBuffer, "audio/mpeg");
    console.log(`STT round-trip transcript: "${stt.transcript}" (language_code=${stt.languageCode})`);
    if (!stt.transcript) throw new Error("FAIL: empty transcript on round-trip");
  }

  console.log("\nPASS");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
