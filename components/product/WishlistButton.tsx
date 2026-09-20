"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export function WishlistButton({ productId, initialSaved }: { productId: string; initialSaved: boolean }) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const method = saved ? "DELETE" : "POST";
    const res = await fetch("/api/wishlist", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    setLoading(false);
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    if (res.ok) {
      setSaved(!saved);
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
      aria-pressed={saved}
      className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border hover:bg-black/5"
    >
      <Heart className={cn("h-5 w-5", saved && "fill-primary text-primary")} />
    </button>
  );
}
