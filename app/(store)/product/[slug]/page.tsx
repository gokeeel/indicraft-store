import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Gallery } from "@/components/product/Gallery";
import { PriceDisplay } from "@/components/product/PriceDisplay";
import { StockBadge } from "@/components/product/StockBadge";
import { AddToCartForm } from "@/components/product/AddToCartForm";
import { WishlistButton } from "@/components/product/WishlistButton";
import { Reviews } from "@/components/product/Reviews";
import { ProductCard } from "@/components/product/ProductCard";
import { getProductBySlug, getRelatedProducts, getProductReviews } from "@/lib/services/catalog";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return {
    title: `${product.name} — Indicraft`,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: product.images[0] ? [product.images[0].url] : [],
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;

  const [related, { reviews, average, count }, wishlisted] = await Promise.all([
    getRelatedProducts(product.categoryId, product.id),
    getProductReviews(product.id),
    userId
      ? prisma.wishlistItem.findUnique({ where: { userId_productId: { userId, productId: product.id } } })
      : null,
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav className="mb-6 text-xs text-muted">
        <Link href="/" className="hover:text-primary">Home</Link>
        <span className="mx-1">/</span>
        <Link href="/shop" className="hover:text-primary">Shop</Link>
        <span className="mx-1">/</span>
        <Link href={`/shop?category=${product.category.slug}`} className="hover:text-primary">
          {product.category.name}
        </Link>
        <span className="mx-1">/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-10 md:grid-cols-2">
        <Gallery images={product.images} name={product.name} />

        <div>
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-bold">{product.name}</h1>
            <WishlistButton productId={product.id} initialSaved={!!wishlisted} />
          </div>
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

          <details className="mt-2 text-sm">
            <summary className="cursor-pointer font-medium">Returns & Exchanges</summary>
            <p className="mt-2 text-muted">
              Eligible for return or exchange within 7 days of delivery if unused and in original
              packaging. Handcrafted items may show minor natural variation — this is not a defect.
            </p>
          </details>
        </div>
      </div>

      <Reviews average={average} count={count} reviews={reviews} />

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
