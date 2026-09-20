import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product/ProductCard";
import { getCategories, getProducts } from "@/lib/services/catalog";

export default async function HomePage() {
  const [categories, featured, dealResult] = await Promise.all([
    getCategories(),
    getProducts({}, "newest", 1, 4),
    getProducts({}, "price_asc", 1, 1),
  ]);
  const deal = dealResult.items[0];

  return (
    <div>
      <section className="relative flex min-h-[420px] items-center bg-[#222] text-white">
        <div className="relative z-10 mx-auto max-w-7xl px-4">
          <span className="inline-block rounded-full bg-primary px-3 py-1 text-xs font-semibold">
            25% OFF Festive Collection
          </span>
          <h1 className="mt-4 max-w-xl text-4xl font-bold md:text-5xl">
            Handcrafted by Indian Artisans
          </h1>
          <p className="mt-4 max-w-lg text-white/80">
            Fabric, home decor, spices and more — sourced directly from craft communities across India.
          </p>
          <Button asChild size="lg" className="mt-6">
            <Link href="/shop">Shop the Collection</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="mb-6 text-2xl font-bold">Shop by Category</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/shop?category=${category.slug}`}
              className="group rounded-lg border border-border bg-white p-4 text-center transition-shadow hover:shadow-md"
            >
              <div className="relative mx-auto mb-3 h-20 w-20 overflow-hidden rounded-full bg-black/5">
                <Image
                  src={`https://source.unsplash.com/200x200/?india,${encodeURIComponent(category.name)}`}
                  alt={category.name}
                  fill
                  className="object-cover"
                />
              </div>
              <p className="text-sm font-medium">{category.name}</p>
              <p className="text-xs text-muted">{category._count.products} items</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="mb-6 text-2xl font-bold">Featured Products</h2>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {featured.items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {deal && (
        <section className="mx-auto max-w-7xl px-4 py-12">
          <div className="grid gap-6 rounded-lg border border-border bg-white p-6 md:grid-cols-2">
            <div className="relative aspect-square overflow-hidden rounded-lg">
              {deal.images[0] && (
                <Image src={deal.images[0].url} alt={deal.name} fill className="object-cover" />
              )}
            </div>
            <div className="flex flex-col justify-center">
              <span className="mb-2 inline-block w-fit rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                Deal of the Day
              </span>
              <h3 className="text-2xl font-bold">{deal.name}</h3>
              <Button asChild className="mt-4 w-fit">
                <Link href={`/product/${deal.slug}`}>View Deal</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid items-center gap-6 md:grid-cols-2">
          <div className="relative aspect-video overflow-hidden rounded-lg">
            <Image src="https://source.unsplash.com/800x600/?indian,artisan,craft" alt="Artisan at work" fill className="object-cover" />
          </div>
          <div>
            <h2 className="mb-3 text-2xl font-bold">Our Artisan Story</h2>
            <p className="text-muted">
              Every Indicraft product is made by hand by skilled artisans across India, preserving
              centuries-old craft traditions while providing fair, direct income to craft communities.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
