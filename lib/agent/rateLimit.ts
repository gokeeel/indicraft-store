const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 20;

// ponytail: in-memory, per-process — fine for a single dev/small-scale instance. Swap for a
// shared store (Redis, etc.) if this ever runs across multiple instances.
const hits = new Map<string, number[]>();

export function checkRateLimit(userId: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const recent = (hits.get(userId) ?? []).filter((t) => now - t < WINDOW_MS);

  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfterSeconds = Math.ceil((WINDOW_MS - (now - recent[0])) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  recent.push(now);
  hits.set(userId, recent);
  return { allowed: true };
}
