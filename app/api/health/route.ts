import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Pings the DB (waking a suspended Neon instance) and checks required env vars are present. Curl
// this before a live demo to warm the connection instead of eating the cold-start delay on the
// first real user action.
export async function GET(req: Request) {
  const envOk = Boolean(process.env.SARVAM_API_KEY) && Boolean(process.env.DATABASE_URL);

  let dbOk = true;
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    dbOk = false;
    console.error("Health check DB error:", err);
  }

  const ok = dbOk && envOk;
  const body: Record<string, unknown> = { ok };

  // Only reveal which check failed to a caller presenting the admin secret, so this endpoint stays
  // safe to curl publicly for demo warm-up without leaking DB error text or env-var presence.
  if (req.headers.get("x-health-secret") === process.env.HEALTH_CHECK_SECRET && process.env.HEALTH_CHECK_SECRET) {
    body.db = dbOk ? "ok" : "error";
    body.env = envOk ? "ok" : "error";
  }

  return NextResponse.json(body, { status: ok ? 200 : 503 });
}
