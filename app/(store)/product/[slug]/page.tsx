import { notFound } from "next/navigation";
import { Gallery } from "@/components/product/Gallery";
import { PriceDisplay } from "@/components/product/PriceDisplay";
import { StockBadge } from "@/components/product/StockBadge";
import { AddToCartForm } from "@/components/product/AddToCartForm";
import { ProductCard } from "@/components/product/ProductCard";
import { getProductBySlug, getRelatedProducts } from "@/lib/services/catalog";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product.categoryId, product.id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid gap-10 md:grid-cols-2">
        <Gallery images={product.images} name={product.name} />

        <div>
          <h1 className="text-2xl font-bold">{product.name}</h1>
          <p className="mt-1 text-sm text-muted">Sold by {product.vendor.storeName}</p>

          <div className="mt-4 text-lg">
            <PriceDisplay price={product.price} salePrice={product.salePrice} />
          </div>

          <div className="mt-3">
            <StockBadge stock={product.stock} />
          </div>

          <p className="mt-4 text-sm text-muted">{product.description}</p>

          <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
            {product.material && (
              <div>
                <dt className="text-muted">Material</dt>
                <dd className="font-medium">{product.material}</dd>
              </div>
            )}
            {product.region && (
              <div>
                <dt className="text-muted">Region</dt>
                <dd className="font-medium">{product.region}</dd>
              </div>
            )}
          </dl>

          <div className="mt-6">
            <AddToCartForm productId={product.id} inStock={product.stock > 0} />
          </div>

          <p className="mt-3 text-xs text-muted">🚚 Free shipping on orders over ₹999</p>

          <details className="mt-6 text-sm">
            <summary className="cursor-pointer font-medium">Care Instructions</summary>
            <p className="mt-2 text-muted">
              Handcrafted item — handle with care. Store in a dry place, avoid direct sunlight and
              harsh chemicals to preserve natural dyes and finishes.
            </p>
          </details>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-xl font-bold">Related Products</h2>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
