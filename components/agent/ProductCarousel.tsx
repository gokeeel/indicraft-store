"use client";

import Link from "next/link";
import Image from "next/image";
import { PriceDisplay } from "@/components/product/PriceDisplay";
import { StockBadge } from "@/components/product/StockBadge";
import type { Money } from "@/lib/types";

type AgentProduct = {
  id: string;
  slug: string;
  name: string;
  price: Money;
  salePrice: Money | null;
  stock: number;
  images: { url: string; altText: string | null }[];
};

export function ProductCarousel({ products }: { products: AgentProduct[] }) {
  if (products.length === 0) {
    return <p className="mt-2 text-sm text-muted">No products matched — want to try different filters?</p>;
  }

  return (
    <div className="mt-2 flex snap-x gap-3 overflow-x-auto pb-2">
      {products.map((p) => (
        <Link
          key={p.id}
          href={`/product/${p.slug}`}
          target="_blank"
          className="w-[150px] shrink-0 snap-start rounded-lg border border-border bg-white p-2 hover:shadow-md"
        >
          <div className="relative aspect-square overflow-hidden rounded-md bg-black/5">
            {p.images[0] && (
              <Image
                src={p.images[0].url}
                alt={p.images[0].altText ?? p.name}
                fill
                sizes="150px"
                className="object-cover"
              />
            )}
          </div>
          <p className="mt-2 line-clamp-2 text-xs font-medium">{p.name}</p>
          <div className="mt-1 text-xs">
            <PriceDisplay price={p.price} salePrice={p.salePrice} />
          </div>
          <div className="mt-1">
            <StockBadge stock={p.stock} />
          </div>
        </Link>
      ))}
    </div>
  );
}
