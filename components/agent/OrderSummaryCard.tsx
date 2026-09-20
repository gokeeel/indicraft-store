"use client";

import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import type { Money } from "@/lib/types";

type OrderLine = { id: string; name: string; quantity: number; price: Money; salePrice: Money | null };
type OrderAddress = { name: string; line1: string; city: string; state: string; zip: string };

export function OrderSummaryCard({
  items,
  address,
  subtotal,
  shipping,
  total,
  expiresAt,
}: {
  items: OrderLine[];
  address: OrderAddress;
  subtotal: number;
  shipping: number;
  total: number;
  confirmToken: string;
  expiresAt: string;
}) {
  return (
    <div className="mt-2 space-y-2 rounded-lg border border-border bg-white p-3 text-xs">
      <p className="text-sm font-semibold">Order Summary</p>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.id} className="flex justify-between">
            <span>
              {item.quantity} × {item.name}
            </span>
            <span>{formatPrice(Number(item.salePrice ?? item.price) * item.quantity)}</span>
          </li>
        ))}
      </ul>
      <p className="text-muted">
        Ship to: {address.name}, {address.line1}, {address.city}, {address.state} {address.zip}
      </p>
      <div className="border-t border-border pt-2">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Shipping</span>
          <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
        </div>
        <div className="mt-1 flex justify-between text-sm font-semibold">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>
      <Button disabled className="w-full" size="sm">
        Confirm Order (coming in the next step)
      </Button>
      <p className="text-[10px] text-muted">This preview expires at {new Date(expiresAt).toLocaleTimeString()}.</p>
    </div>
  );
}
