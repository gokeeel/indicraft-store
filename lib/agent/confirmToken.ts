import crypto from "node:crypto";

const TOKEN_TTL_MS = 10 * 60 * 1000;

export type ConfirmTokenPayload = {
  userId: string;
  addressId: string;
  cartHash: string;
  exp: number; // epoch ms
};

function secret() {
  const s = process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error("NEXTAUTH_SECRET is required to sign confirm tokens");
  return s;
}

function sign(body: string) {
  return crypto.createHmac("sha256", secret()).update(body).digest("base64url");
}

/** Deterministic hash of cart contents, used to detect the cart changing between preview and confirm. */
export function hashCart(items: { productId: string; quantity: number }[]) {
  const normalized = [...items]
    .map((i) => ({ productId: i.productId, quantity: i.quantity }))
    .sort((a, b) => a.productId.localeCompare(b.productId));
  return crypto.createHash("sha256").update(JSON.stringify(normalized)).digest("hex");
}

export function createConfirmToken(userId: string, addressId: string, cartHash: string) {
  const payload: ConfirmTokenPayload = { userId, addressId, cartHash, exp: Date.now() + TOKEN_TTL_MS };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const token = `${body}.${sign(body)}`;
  return { token, expiresAt: new Date(payload.exp).toISOString() };
}

export type VerifyResult = { ok: true; payload: ConfirmTokenPayload } | { ok: false; reason: string };

// Note: this only verifies signature, expiry, and binding (user/address/cart). "Single-use" also
// requires persisted state (has this token already been redeemed?) — that lands with the actual
// order-creation transaction in Phase 5, since that's where "used" has to be recorded atomically.
export function verifyConfirmToken(token: string): VerifyResult {
  const [body, signature] = token.split(".");
  if (!body || !signature) return { ok: false, reason: "malformed" };

  const expected = sign(body);
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return { ok: false, reason: "invalid_signature" };
  }

  let payload: ConfirmTokenPayload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return { ok: false, reason: "malformed" };
  }

  if (Date.now() > payload.exp) return { ok: false, reason: "expired" };
  return { ok: true, payload };
}
