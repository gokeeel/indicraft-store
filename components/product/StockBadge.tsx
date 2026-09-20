import { cn } from "@/lib/utils";

export function StockBadge({ stock }: { stock: number }) {
  const inStock = stock > 0;
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
        inStock ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
      )}
    >
      {inStock ? "In Stock" : "Out of Stock"}
    </span>
  );
}
