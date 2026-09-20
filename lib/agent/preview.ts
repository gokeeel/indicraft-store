import { getCartSummary } from "@/lib/services/catalog";
import { getAddressForUser } from "@/lib/services/addresses";
import { hashCartItems } from "@/lib/services/cart";
import { createConfirmToken } from "@/lib/agent/confirmToken";

export type OrderPreview = {
  items: Awaited<ReturnType<typeof getCartSummary>>["items"];
  address: NonNullable<Awaited<ReturnType<typeof getAddressForUser>>>;
  subtotal: number;
  shipping: number;
  total: number;
  confirmToken: string;
  expiresAt: string;
};

export type OrderPreviewResult = { ok: true; preview: OrderPreview } | { ok: false; error: string };

export async function buildOrderPreview(userId: string, addressId: string): Promise<OrderPreviewResult> {
  const address = await getAddressForUser(userId, addressId);
  if (!address) return { ok: false, error: "That address wasn't found on your account." };

  const cart = await getCartSummary(userId);
  if (cart.items.length === 0) return { ok: false, error: "Your cart is empty." };

  const cartHash = hashCartItems(cart.items.map((i) => ({ productId: i.productId, quantity: i.quantity })));
  const { token, expiresAt } = createConfirmToken(userId, addressId, cartHash);

  return {
    ok: true,
    preview: {
      items: cart.items,
      address,
      subtotal: cart.subtotal,
      shipping: cart.shipping,
      total: cart.total,
      confirmToken: token,
      expiresAt,
    },
  };
}
