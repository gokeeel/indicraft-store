"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export function WishlistButton({
  productId,
  initialSaved,
  compact,
}: {
  productId: string;
  initialSaved: boolean;
  /** Small overlay style for use on a ProductCard, where this sits inside a <Link>. */
  compact?: boolean;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);

  async function toggle(e: React.MouseEvent) {
    if (compact) {
      e.preventDefault();
      e.stopPropagation();
    }
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
      className={
        compact
          ? "absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 shadow-sm hover:bg-white"
          : "inline-flex h-10 w-10 items-center justify-center rounded-md border border-border hover:bg-black/5"
      }
    >
      <Heart className={cn(compact ? "h-4 w-4" : "h-5 w-5", saved && "fill-primary text-primary")} />
    </button>
  );
}
