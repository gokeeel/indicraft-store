import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Neon's free tier suspends after inactivity; the first query after a cold start can time out or
// throw a connection error. Route handlers that skip this land on Next's raw crash page instead of
// a JSON error the client can show a "try again" message for.
export async function withDb<T>(fn: () => Promise<T>): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    return { ok: true, data: await fn() };
  } catch (err) {
    console.error("Database error:", err);
    return { ok: false, error: "Database temporarily unavailable. Please try again in a moment." };
  }
}
