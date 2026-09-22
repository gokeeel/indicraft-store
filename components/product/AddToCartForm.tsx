"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AddToCartForm({ productId, inStock }: { productId: string; inStock: boolean }) {
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState<"idle" | "loading" | "added" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  async function addToCart(): Promise<boolean> {
    setStatus("loading");
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity }),
    });
    if (res.status === 401) {
      router.push("/login");
      return false;
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErrorMessage(data.error ?? "Something went wrong.");
      setStatus("error");
      return false;
    }
    setStatus("added");
    router.refresh();
    return true;
  }

  async function handleBuyNow() {
    if (await addToCart()) router.push("/checkout");
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        type="number"
        min={1}
        value={quantity}
        onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
        className="w-20"
        disabled={!inStock}
      />
      <Button onClick={addToCart} disabled={!inStock || status === "loading"}>
        {status === "added" ? "Added!" : "Add to Cart"}
      </Button>
      <Button variant="outline" onClick={handleBuyNow} disabled={!inStock || status === "loading"}>
        Buy Now
      </Button>
      {status === "error" && <span className="text-sm text-red-600">{errorMessage}</span>}
    </div>
  );
}
