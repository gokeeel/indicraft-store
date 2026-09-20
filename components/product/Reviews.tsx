"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Review = { id: string; rating: number; comment: string | null; createdAt: string | Date; user: { name: string } };

function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          width={size}
          height={size}
          className={n <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-border"}
        />
      ))}
    </div>
  );
}

export function Reviews({
  productId,
  average,
  count,
  reviews,
  canReview,
}: {
  productId: string;
  average: number;
  count: number;
  reviews: Review[];
  canReview: boolean;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setSubmitting(true);
    setError("");
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, rating, comment: comment.trim() || undefined }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not submit review.");
      return;
    }
    setComment("");
    router.refresh();
  }

  return (
    <section className="mt-16 max-w-2xl">
      <h2 className="mb-3 text-xl font-bold">Reviews</h2>
      <div className="mb-6 flex items-center gap-3">
        <Stars value={average} size={20} />
        <span className="text-sm text-muted">
          {count > 0 ? `${average.toFixed(1)} out of 5 (${count} review${count === 1 ? "" : "s"})` : "No reviews yet"}
        </span>
      </div>

      {canReview && (
        <div className="mb-8 rounded-lg border border-border bg-white p-4">
          <p className="mb-2 text-sm font-medium">Write a review</p>
          <div className="mb-2 flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} stars`}>
                <Star
                  width={22}
                  height={22}
                  className={cn(n <= rating ? "fill-amber-400 text-amber-400" : "text-border")}
                />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your thoughts (optional)"
            className="mb-2 w-full rounded-md border border-border p-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            rows={3}
          />
          {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
          <Button onClick={submit} disabled={submitting} size="sm">
            {submitting ? "Submitting..." : "Submit Review"}
          </Button>
        </div>
      )}

      <ul className="space-y-4">
        {reviews.map((r) => (
          <li key={r.id} className="border-t border-border pt-4">
            <div className="flex items-center gap-2">
              <Stars value={r.rating} />
              <span className="text-sm font-medium">{r.user.name}</span>
            </div>
            {r.comment && <p className="mt-1 text-sm text-muted">{r.comment}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
