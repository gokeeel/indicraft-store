"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus } from "lucide-react";

export function QuantityStepper({
  itemId,
  quantity,
  stock,
}: {
  itemId: string;
  quantity: number;
  stock: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function setQuantity(next: number) {
    if (next < 1 || next > stock) return;
    setError(null);
    const res = await fetch(`/api/cart/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: next }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Couldn't update quantity.");
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <div>
      <div className="inline-flex items-center rounded-md border border-border">
        <button
          type="button"
          onClick={() => setQuantity(quantity - 1)}
          disabled={pending || quantity <= 1}
          aria-label="Decrease quantity"
          className="flex h-8 w-8 items-center justify-center text-muted hover:text-foreground disabled:opacity-40"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="w-8 text-center text-sm" aria-live="polite">
          {quantity}
        </span>
        <button
          type="button"
          onClick={() => setQuantity(quantity + 1)}
          disabled={pending || quantity >= stock}
          aria-label="Increase quantity"
          className="flex h-8 w-8 items-center justify-center text-muted hover:text-foreground disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
