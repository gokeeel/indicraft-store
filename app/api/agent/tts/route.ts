import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { checkRateLimit } from "@/lib/agent/rateLimit";
import { synthesizeSpeech } from "@/lib/agent/tts";

// Split out of /api/agent/voice so the text/blocks response can render immediately after
// STT+LLM instead of waiting for speech synthesis too -- see that route for the full reasoning.
const bodySchema = z.object({
  text: z.string().min(1).max(2000),
  languageCode: z.string().max(20).optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rate = checkRateLimit(userId);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Venmathi's a little overwhelmed — give her a few seconds and try again." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
    );
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  try {
    const result = await synthesizeSpeech(parsed.data.text, parsed.data.languageCode);
    return NextResponse.json({ assistantAudio: result.audioBase64 });
  } catch (err) {
    console.error("[agent/tts]", err);
    // Voice playback is a nice-to-have on top of the text/blocks response the user already has
    // -- fail quietly with a field the client checks, not a 500 that looks like the whole turn broke.
    return NextResponse.json({ assistantAudio: null });
  }
}
