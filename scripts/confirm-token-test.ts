/**
 * Quick sanity check for lib/agent/confirmToken.ts: valid token verifies, tampering
 * with the payload or signature is rejected, and an expired token is rejected.
 * Run: npx tsx scripts/confirm-token-test.ts
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import crypto from "node:crypto";

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

import { createConfirmToken, verifyConfirmToken } from "../lib/agent/confirmToken";

let failures = 0;
function check(label: string, condition: boolean) {
  console.log(`${condition ? "PASS" : "FAIL"} ${label}`);
  if (!condition) failures++;
}

const { token } = createConfirmToken("user-1", "addr-1", "cart-hash-abc");

const fresh = verifyConfirmToken(token);
check("valid token verifies", fresh.ok === true);
if (fresh.ok) {
  check("payload round-trips correctly", fresh.payload.userId === "user-1" && fresh.payload.addressId === "addr-1" && fresh.payload.cartHash === "cart-hash-abc");
}

const [body, signature] = token.split(".");
const tamperedBody = Buffer.from(JSON.stringify({ userId: "attacker", addressId: "addr-1", cartHash: "cart-hash-abc", exp: Date.now() + 60_000 })).toString("base64url");
const tamperedToken = `${tamperedBody}.${signature}`;
const tamperedResult = verifyConfirmToken(tamperedToken);
check("tampered payload (reused signature) is rejected", tamperedResult.ok === false && tamperedResult.reason === "invalid_signature");

const badSigToken = `${body}.${signature.slice(0, -2)}xx`;
const badSigResult = verifyConfirmToken(badSigToken);
check("corrupted signature is rejected", badSigResult.ok === false);

const malformed = verifyConfirmToken("not-a-real-token");
check("malformed token is rejected", malformed.ok === false && malformed.reason === "malformed");

// Build an already-expired token by hand (createConfirmToken always uses the real 10-min TTL).
const expiredPayload = { userId: "user-1", addressId: "addr-1", cartHash: "cart-hash-abc", exp: Date.now() - 1000 };
const expiredBody = Buffer.from(JSON.stringify(expiredPayload)).toString("base64url");
const expiredSig = crypto.createHmac("sha256", process.env.NEXTAUTH_SECRET as string).update(expiredBody).digest("base64url");
const expiredToken = `${expiredBody}.${expiredSig}`;
const expiredResult = verifyConfirmToken(expiredToken);
check("expired token is rejected", expiredResult.ok === false && expiredResult.reason === "expired");

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
