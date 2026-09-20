import { Star } from "lucide-react";

type Review = { id: string; rating: number; comment: string | null; user: { name: string } };

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
  average,
  count,
  reviews,
}: {
  average: number;
  count: number;
  reviews: Review[];
}) {
  return (
    <section className="mt-16 max-w-2xl">
      <h2 className="mb-3 text-xl font-bold">Reviews</h2>
      <div className="mb-6 flex items-center gap-3">
        <Stars value={average} size={20} />
        <span className="text-sm text-muted">
          {count > 0 ? `${average.toFixed(1)} out of 5 (${count} review${count === 1 ? "" : "s"})` : "No reviews yet"}
        </span>
      </div>

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
