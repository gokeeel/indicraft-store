import crypto from "node:crypto";
import type { PaymentProvider } from "@/lib/agent/payments";

const RAZORPAY_BASE_URL = "https://api.razorpay.com/v1";

function credentials() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error("Razorpay keys are not configured");
  return { keyId, keySecret };
}

function authHeader() {
  const { keyId, keySecret } = credentials();
  return "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64");
}

/**
 * Real Razorpay Payment Links, test mode. Verified against the current API docs and the
 * official razorpay-node SDK source (docs fetched live, not assumed from training data):
 * POST /v1/payment_links, Basic Auth, amount in paise. The redirect callback appends
 * razorpay_payment_id/payment_link_id/payment_link_reference_id/payment_link_status/signature;
 * signature = HMAC-SHA256(secret, `${paymentLinkId}|${refId}|${status}|${paymentId}`).
 *
 * Webhook support (the other half of PRD 5.4's "verification on return/webhook") is not
 * implemented here: Razorpay can't reach a local dev server, so there'd be no way to actually
 * exercise it before this app has a public URL. Add it post-deploy, alongside a configured
 * webhook secret from the Razorpay dashboard.
 */
export class RazorpayProvider implements PaymentProvider {
  async createPaymentLink({ orderId, amount }: { orderId: string; amount: number }) {
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

    const res = await fetch(`${RAZORPAY_BASE_URL}/payment_links/`, {
      method: "POST",
      headers: { Authorization: authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // rupees -> paise
        currency: "INR",
        description: `Indicraft order #${orderId.slice(-8).toUpperCase()}`,
        reference_id: orderId,
        callback_url: `${baseUrl}/pay/razorpay/callback`,
        callback_method: "get",
        notes: { orderId },
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Razorpay payment link creation failed (${res.status}): ${body.slice(0, 300)}`);
    }

    const data = await res.json();
    return { url: data.short_url as string };
  }
}

export function verifyPaymentLinkSignature(input: {
  paymentLinkId: string;
  paymentLinkReferenceId: string;
  paymentLinkStatus: string;
  paymentId: string;
  signature: string;
}): boolean {
  const { keySecret } = credentials();
  const payload = `${input.paymentLinkId}|${input.paymentLinkReferenceId}|${input.paymentLinkStatus}|${input.paymentId}`;
  const expected = crypto.createHmac("sha256", keySecret).update(payload).digest("hex");

  const sigBuf = Buffer.from(input.signature);
  const expBuf = Buffer.from(expected);
  return sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);
}
