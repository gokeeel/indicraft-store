import type { Money } from "@/lib/types";

export const TAX_RATE = 0.05;
export const FREE_SHIPPING_THRESHOLD = 999;
export const SHIPPING_FLAT_RATE = 99;

export function computeCartTotals(subtotal: number) {
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT_RATE;
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  const total = subtotal + tax + shipping;
  return { subtotal, shipping, tax, total };
}

export function cartSubtotal(items: { quantity: number; product: { price: Money; salePrice: Money | null } }[]) {
  return items.reduce(
    (sum, item) => sum + Number(item.product.salePrice ?? item.product.price) * item.quantity,
    0
  );
}
