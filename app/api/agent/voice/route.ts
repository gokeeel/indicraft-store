import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { getLLM } from "@/lib/agent/sarvam";
import { runAgentLoop } from "@/lib/agent/loop";
import { checkRateLimit } from "@/lib/agent/rateLimit";
import { transcribeAudio } from "@/lib/agent/stt";

const MAX_AUDIO_BYTES = 5 * 1024 * 1024;

const historyEntrySchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(2000),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // STT is heavier than a text turn but TTS now happens in a separate /api/agent/tts call
  // (see that route for why), so this one counts as a single request like /api/agent/chat.
  const rate = checkRateLimit(userId);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Venmathi's a little overwhelmed — give her a few seconds and try again." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
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

    // TTS is deliberately not synthesized here -- the client renders this text/blocks response
    // immediately, then fires a separate /api/agent/tts call and plays audio when that resolves.
    // Doing TTS inline used to mean the user saw and heard nothing until STT+LLM+TTS all
    // finished; splitting it cuts perceived latency to roughly STT+LLM, with audio catching up
    // a beat later instead of gating everything.
    return NextResponse.json({
      userTranscript: stt.transcript,
      detectedLanguage: stt.languageCode,
      assistantText: agentResult.assistantText,
      blocks: agentResult.blocks,
    });
  } catch (err) {
    console.error("[agent/voice]", err);
    return NextResponse.json({ error: "Voice processing failed. Try typing instead." }, { status: 500 });
  }
}
