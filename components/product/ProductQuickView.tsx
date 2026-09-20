"use client";

import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PriceDisplay } from "@/components/product/PriceDisplay";
import type { Money } from "@/lib/types";

export function ProductQuickView({
  open,
  onOpenChange,
  product,
  vendorName,
  onAddToCart,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: { name: string; price: Money; salePrice: Money | null; images: { url: string; altText: string | null }[] };
  vendorName?: string;
  onAddToCart?: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="relative aspect-square overflow-hidden rounded-lg bg-white">
            {product.images[0] && (
              <Image src={product.images[0].url} alt={product.images[0].altText ?? product.name} fill className="object-cover" />
            )}
          </div>
          <div>
            <DialogTitle className="text-xl font-semibold">{product.name}</DialogTitle>
            {vendorName && <p className="mt-1 text-sm text-muted">Sold by {vendorName}</p>}
            <div className="mt-3">
              <PriceDisplay price={product.price} salePrice={product.salePrice} />
            </div>
            <Button className="mt-6 w-full" onClick={onAddToCart}>
              Add to Cart
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
