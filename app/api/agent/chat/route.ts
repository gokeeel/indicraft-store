import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { getLLM } from "@/lib/agent/sarvam";
import { runAgentLoop } from "@/lib/agent/loop";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(2000),
});

const bodySchema = z.object({
  messages: z.array(messageSchema).min(1).max(40),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // Trim to the last ~20 turns; full cart-state summarization lands with the cart tools in Phase 3.
  const history = parsed.data.messages.slice(-20);

  try {
    const result = await runAgentLoop(getLLM(), history, { userId });
    return NextResponse.json(result);
  } catch (err) {
    console.error("[agent/chat]", err);
    return NextResponse.json(
      { assistantText: "Oops, something glitched on my side. Try again in a bit?", blocks: [] },
      { status: 200 }
    );
  }
}
