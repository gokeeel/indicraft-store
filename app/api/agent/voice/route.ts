import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { getLLM } from "@/lib/agent/sarvam";
import { runAgentLoop } from "@/lib/agent/loop";
import { checkRateLimit } from "@/lib/agent/rateLimit";
import { transcribeAudio } from "@/lib/agent/stt";
import { synthesizeSpeech } from "@/lib/agent/tts";

const MAX_AUDIO_BYTES = 5 * 1024 * 1024;

const historyEntrySchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(2000),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Voice is more expensive than a text turn (STT + LLM + TTS) — count it as 2 requests
  // against the same per-user bucket used by /api/agent/chat.
  const first = checkRateLimit(userId);
  const second = checkRateLimit(userId);
  if (!first.allowed || !second.allowed) {
    const retryAfterSeconds = second.retryAfterSeconds ?? first.retryAfterSeconds;
    return NextResponse.json(
      { error: "Venmathi's a little overwhelmed — give her a few seconds and try again." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }

  const formData = await req.formData().catch(() => null);
  const audioFile = formData?.get("audio");
  if (!formData || !(audioFile instanceof File)) {
    return NextResponse.json({ error: "No audio provided" }, { status: 400 });
  }
  if (audioFile.size > MAX_AUDIO_BYTES) {
    return NextResponse.json({ error: "Audio too large (max 5MB)" }, { status: 400 });
  }

  const historyRaw = formData.get("history");
  const historyParsed = z.array(historyEntrySchema).max(40).safeParse(
    historyRaw ? JSON.parse(String(historyRaw)) : []
  );
  if (!historyParsed.success) {
    return NextResponse.json({ error: "Invalid history" }, { status: 400 });
  }

  try {
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
    const stt = await transcribeAudio(audioBuffer, audioFile.type || "audio/webm");

    if (!stt.transcript) {
      return NextResponse.json(
        { error: "empty_transcript", message: "Couldn't understand the audio. Please try again." },
        { status: 400 }
      );
    }

    const history = [...historyParsed.data, { role: "user" as const, content: stt.transcript }];
    const agentResult = await runAgentLoop(getLLM(), history, { userId });

    let assistantAudio: string | null = null;
    if (agentResult.assistantText) {
      assistantAudio = await synthesizeSpeech(agentResult.assistantText, stt.languageCode)
        .then((r) => r.audioBase64)
        .catch((err) => {
          console.error("[agent/voice] TTS failed, falling back to text-only", err);
          return null;
        });
    }

    return NextResponse.json({
      userTranscript: stt.transcript,
      detectedLanguage: stt.languageCode,
      assistantText: agentResult.assistantText,
      assistantAudio,
      blocks: agentResult.blocks,
    });
  } catch (err) {
    console.error("[agent/voice]", err);
    return NextResponse.json({ error: "Voice processing failed. Try typing instead." }, { status: 500 });
  }
}
