"use client";

import Link from "next/link";
import Image from "next/image";
import { PriceDisplay } from "@/components/product/PriceDisplay";
import { StockBadge } from "@/components/product/StockBadge";
import type { Money } from "@/lib/types";

type AgentProductDetail = {
  slug: string;
  name: string;
  description: string;
  price: Money;
  salePrice: Money | null;
  stock: number;
  material: string | null;
  region: string | null;
  images: { url: string; altText: string | null }[];
  vendor: { storeName: string };
};

export function ProductDetailCard({ product }: { product: AgentProductDetail }) {
  return (
    <div className="mt-2 rounded-lg border border-border bg-white p-3">
      <div className="flex gap-3">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-black/5">
          {product.images[0] && (
            <Image src={product.images[0].url} alt={product.name} fill sizes="80px" className="object-cover" />
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{product.name}</p>
          <p className="text-xs text-muted">Sold by {product.vendor.storeName}</p>
          <div className="mt-1 text-sm">
            <PriceDisplay price={product.price} salePrice={product.salePrice} />
          </div>
          <div className="mt-1">
            <StockBadge stock={product.stock} />
          </div>
        </div>
      </div>
      {(product.material || product.region) && (
        <p className="mt-2 text-xs text-muted">
          {[product.material, product.region].filter(Boolean).join(" · ")}
        </p>
      )}
      <p className="mt-2 line-clamp-3 text-xs text-muted">{product.description}</p>
      <Link
        href={`/product/${product.slug}`}
        target="_blank"
        className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
      >
        View full details →
      </Link>
    </div>
  );
}
