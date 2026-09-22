import Link from "next/link";
import Image from "next/image";
import { PriceDisplay } from "@/components/product/PriceDisplay";
import { ProductSummary } from "@/lib/types";

export function ProductCard({ product }: { product: ProductSummary }) {
  const image = product.images[0];
  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-white border border-border">
        {image && (
          <Image
            src={image.url}
            alt={image.altText ?? product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform group-hover:scale-105"
          />
        )}
        <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium">
          {product.category.name}
        </span>
        {product.stock <= 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <span className="rounded-full bg-black/80 px-3 py-1 text-xs font-semibold text-white">Sold Out</span>
          </div>
        )}
      </div>
      <div className="mt-2">
        <h3 className="line-clamp-1 text-sm font-medium">{product.name}</h3>
        {(product.artisan || product.region) && (
          <p className="line-clamp-1 text-xs text-muted">
            {product.artisan}
            {product.artisan && product.region && " · "}
            {product.region}
          </p>
        )}
        <PriceDisplay price={product.price} salePrice={product.salePrice} />
      </div>
    </Link>
  );
}
