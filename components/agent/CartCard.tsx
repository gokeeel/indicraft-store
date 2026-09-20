"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { computeCartTotals, cartSubtotal } from "@/lib/services/pricing";
import type { Money } from "@/lib/types";

type CartLine = {
  id: string;
  productId: string;
  name: string;
  slug: string;
  image: string | null;
  price: Money;
  salePrice: Money | null;
  quantity: number;
  stock: number;
};

export function CartCard({ items: initialItems }: { items: CartLine[] }) {
  const [items, setItems] = useState(initialItems);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const totals = computeCartTotals(
    cartSubtotal(items.map((i) => ({ quantity: i.quantity, product: { price: i.price, salePrice: i.salePrice } })))
  );

  async function setQuantity(itemId: string, quantity: number) {
    setError("");
    setBusyId(itemId);
    const res = await fetch(`/api/cart/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
    });
    setBusyId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not update quantity.");
      return;
    }
    setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, quantity } : i)));
  }

  async function remove(itemId: string) {
    setError("");
    setBusyId(itemId);
    await fetch(`/api/cart/${itemId}`, { method: "DELETE" });
    setBusyId(null);
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  }

  if (items.length === 0) {
    return <p className="mt-2 text-sm text-muted">Your cart is empty.</p>;
  }

  return (
    <div className="mt-2 space-y-2 rounded-lg border border-border bg-white p-3">
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="flex gap-2">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-black/5">
              {item.image && <Image src={item.image} alt={item.name} fill sizes="48px" className="object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <Link
                href={`/product/${item.slug}`}
                target="_blank"
                className="block truncate text-xs font-medium hover:text-primary"
              >
                {item.name}
              </Link>
              <p className="text-xs text-muted">{formatPrice(item.salePrice ?? item.price)} each</p>
              <div className="mt-1 flex items-center gap-2">
                <button
                  type="button"
                  disabled={busyId === item.id || item.quantity <= 1}
                  onClick={() => setQuantity(item.id, item.quantity - 1)}
                  className="h-5 w-5 rounded border border-border text-xs disabled:opacity-40"
                  aria-label={`Decrease quantity of ${item.name}`}
                >
                  −
                </button>
                <span className="w-4 text-center text-xs">{item.quantity}</span>
                <button
                  type="button"
                  disabled={busyId === item.id || item.quantity >= item.stock}
                  onClick={() => setQuantity(item.id, item.quantity + 1)}
                  className="h-5 w-5 rounded border border-border text-xs disabled:opacity-40"
                  aria-label={`Increase quantity of ${item.name}`}
                >
                  +
                </button>
                <button
                  type="button"
                  disabled={busyId === item.id}
                  onClick={() => remove(item.id)}
                  className="ml-1 text-xs text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="border-t border-border pt-2 text-xs">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatPrice(totals.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Shipping</span>
          <span>{totals.shipping === 0 ? "Free" : formatPrice(totals.shipping)}</span>
        </div>
        <div className="mt-1 flex justify-between text-sm font-semibold">
          <span>Total</span>
          <span>{formatPrice(totals.total)}</span>
        </div>
      </div>

      <Button asChild size="sm" className="w-full">
        <Link href="/checkout">Checkout</Link>
      </Button>
    </div>
  );
}
