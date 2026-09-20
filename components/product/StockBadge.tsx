import { cn } from "@/lib/utils";

const LOW_STOCK_THRESHOLD = 5;

export function StockBadge({ stock }: { stock: number }) {
  const inStock = stock > 0;
  const lowStock = inStock && stock <= LOW_STOCK_THRESHOLD;
  const label = !inStock ? "Out of Stock" : lowStock ? `Only ${stock} left` : "In Stock";
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
        !inStock && "bg-red-100 text-red-700",
        lowStock && "bg-amber-100 text-amber-700",
        inStock && !lowStock && "bg-green-100 text-green-700"
      )}
    >
      {label}
    </span>
  );
}
