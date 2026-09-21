/**
 * Phase 7 acceptance check: 20 requests/min allowed, 21st+ blocked with retryAfterSeconds.
 */
import { checkRateLimit } from "../lib/agent/rateLimit";

const results: boolean[] = [];
for (let i = 0; i < 22; i++) {
  const r = checkRateLimit("test-user");
  results.push(r.allowed);
  if (!r.allowed) console.log(`request ${i + 1}: blocked, retryAfter=${r.retryAfterSeconds}s`);
}
const allowedCount = results.filter(Boolean).length;
console.log(`allowed: ${allowedCount}/22 (expect 20)`);
if (allowedCount !== 20) {
  console.error("FAIL");
  process.exit(1);
}
console.log("PASS");
