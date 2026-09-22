import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product/ProductCard";
import { AskVenmathiButton } from "@/components/agent/AskVenmathiButton";
import { getCategories, getProducts } from "@/lib/services/catalog";

const QUICK_PROMPTS = [
  "Find me a handmade gift under ₹1,500",
  "Show me home decor from Rajasthan",
  "Find a traditional fabric for a wedding",
  "What can I get for ₹2,000?",
];

const CATEGORY_IMAGES: Record<string, string> = {
  fabric: "/images/category-fabric.jpg",
  "home-decor": "/images/category-home-decor.jpg",
  household: "/images/category-household.jpg",
};

export default async function HomePage() {
  const [categories, featured, dealResult] = await Promise.all([
    getCategories(),
    getProducts({}, "newest", 1, 4),
    getProducts({}, "price_asc", 1, 1),
  ]);
  const deal = dealResult.items[0];

  return (
    <div>
      <section className="relative flex min-h-[420px] items-center text-white">
        <Image
          src="/images/hero.jpg"
          alt="Artisan at a handloom"
          fill
          priority
          className="object-cover object-[70%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/10" />
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
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/shop">Shop the Collection</Link>
            </Button>
            <AskVenmathiButton prompt="Hi! What can you help me find?" className="border-white/40 bg-white/10 text-white hover:bg-white/20">
              Ask Venmathi
            </AskVenmathiButton>
          </div>
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
                  src={CATEGORY_IMAGES[category.slug] ?? `https://picsum.photos/seed/${category.slug}/200/200`}
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

      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="rounded-lg border border-border bg-[#f7f5f2] p-8 text-center">
          <h2 className="text-2xl font-bold">Ask Venmathi</h2>
          <p className="mx-auto mt-2 max-w-lg text-muted">
            Tell me what you&apos;re looking for. I can find products, compare options, add them to
            your cart, and help you complete checkout — by text or voice.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {QUICK_PROMPTS.map((prompt) => (
              <AskVenmathiButton key={prompt} prompt={prompt} variant="outline" className="bg-white">
                {prompt}
              </AskVenmathiButton>
            ))}
          </div>
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
            <Image src="/images/artisan-story.jpg" alt="Artisan hand-carving woodwork" fill className="object-cover" />
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
