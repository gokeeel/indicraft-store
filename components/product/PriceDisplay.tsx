import { formatPrice } from "@/lib/utils";
import type { Money } from "@/lib/types";

export function PriceDisplay({ price, salePrice }: { price: Money; salePrice?: Money | null }) {
  if (salePrice) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-semibold text-primary">{formatPrice(salePrice)}</span>
        <span className="text-sm text-muted line-through">{formatPrice(price)}</span>
      </div>
    );
  }
  return <span className="font-semibold">{formatPrice(price)}</span>;
}
