"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuickAddButton({ productId, inStock }: { productId: string; inStock: boolean }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "added" | "error">("idle");

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!inStock || status === "loading") return;
    setStatus("loading");
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity: 1 }),
    });
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    setStatus(res.ok ? "added" : "error");
    if (res.ok) router.refresh();
    setTimeout(() => setStatus("idle"), 2000);
  }

  if (!inStock) return null;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={status === "loading"}
      aria-label="Quick add to cart"
      className={cn(
        "absolute bottom-2 right-2 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-md hover:bg-primary hover:text-primary-foreground",
        status === "added" && "bg-primary text-primary-foreground"
      )}
    >
      {status === "added" ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
    </button>
  );
}
