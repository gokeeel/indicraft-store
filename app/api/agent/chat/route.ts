import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { getLLM } from "@/lib/agent/sarvam";
import { runAgentLoopStream } from "@/lib/agent/loop";
import { checkRateLimit } from "@/lib/agent/rateLimit";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  // Assistant turns can legitimately have empty text when the reply is carried entirely by
  // blocks (e.g. a cart card after "add to cart"). Since the full history is resent every
  // turn, requiring min(1) here would permanently 400 every later request once that happens.
  content: z.string().max(2000),
});

const bodySchema = z.object({
  messages: z.array(messageSchema).min(1).max(40),
});

// Streamed as newline-delimited JSON: each line is {"type":"text","delta":"..."} or
// {"type":"blocks","blocks":[...]}. The client reads via a ReadableStream reader and renders
// text deltas as they arrive; blocks (product cards, cart, etc.) show up once tool results
// are ready, same as before — only the assistant's own prose is what actually streams.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rateLimit = checkRateLimit(userId);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Venmathi's a little overwhelmed — give her a few seconds and try again." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  // Trim to the last ~20 turns.
  const history = parsed.data.messages.slice(-20);

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      function send(obj: unknown) {
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      }
      try {
        for await (const chunk of runAgentLoopStream(getLLM(), history, { userId })) {
          send(chunk);
        }
      } catch (err) {
        console.error("[agent/chat]", err);
        send({ type: "text", delta: "Oops, something glitched on my side. Try again in a bit?" });
        send({ type: "blocks", blocks: [] });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8" } });
}
