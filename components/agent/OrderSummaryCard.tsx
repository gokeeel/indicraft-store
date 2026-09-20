"use client";

import { useState } from "react";
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
  confirmToken,
  expiresAt,
  onConfirm,
}: {
  items: OrderLine[];
  address: OrderAddress;
  subtotal: number;
  shipping: number;
  total: number;
  confirmToken: string;
  expiresAt: string;
  onConfirm: (confirmToken: string) => Promise<void>;
}) {
  // Once submitted, stays disabled regardless of outcome — retrying goes through a fresh
  // preview (new token), not a second click on this same card. Expiry itself isn't
  // pre-checked here (that would call Date.now() during render); the server already
  // rejects an expired token with a clear error message via onConfirm.
  const [state, setState] = useState<"idle" | "confirming" | "done">("idle");

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
      <Button
        className="w-full"
        size="sm"
        disabled={state !== "idle"}
        onClick={async () => {
          setState("confirming");
          await onConfirm(confirmToken);
          setState("done");
        }}
      >
        {state === "confirming" ? "Confirming..." : state === "done" ? "Order Confirmed" : "Confirm Order"}
      </Button>
      {state === "idle" && (
        <p className="text-[10px] text-muted">This preview expires at {new Date(expiresAt).toLocaleTimeString()}.</p>
      )}
    </div>
  );
}
