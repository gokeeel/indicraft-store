import { verifyConfirmToken } from "@/lib/agent/confirmToken";
import { createOrderFromCart, OrderCreationError, isRetryableTransactionError } from "@/lib/services/orders";
import { getPaymentProvider } from "@/lib/agent/payments";

export type ConfirmResult =
  | { ok: true; orderId: string; orderNumber: string; amount: number; paymentUrl: string }
  | { ok: false; error: string };

export async function confirmOrder(userId: string, confirmToken: string): Promise<ConfirmResult> {
  const verified = verifyConfirmToken(confirmToken);
  if (!verified.ok) {
    const message =
      verified.reason === "expired"
        ? "This order preview expired — please review your cart and try again."
        : "That confirmation link isn't valid — please review your cart and try again.";
    return { ok: false, error: message };
  }

  if (verified.payload.userId !== userId) {
    return { ok: false, error: "That confirmation link isn't valid — please review your cart and try again." };
  }

  try {
    const order = await createOrderFromCart(userId, verified.payload.addressId, {
      expectedCartHash: verified.payload.cartHash,
    });

    const provider = getPaymentProvider();
    const payment = await provider.createPaymentLink({ orderId: order.id, amount: Number(order.total) });

    return {
      ok: true,
      orderId: order.id,
      orderNumber: order.id.slice(-8).toUpperCase(),
      amount: Number(order.total),
      paymentUrl: payment.url,
    };
  } catch (err) {
    if (err instanceof OrderCreationError) return { ok: false, error: err.message };
    if (isRetryableTransactionError(err)) return { ok: false, error: "Please try confirming again." };
    throw err;
  }
}
