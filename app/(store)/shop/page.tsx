import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ProductCard } from "@/components/product/ProductCard";
import { ShopFilters } from "@/components/shop/ShopFilters";
import { ActiveFilters } from "@/components/shop/ActiveFilters";
import { SortSelect } from "@/components/shop/SortSelect";
import { Pagination } from "@/components/shop/Pagination";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { getCategories, getFilterOptions, getProducts, getWishlistedProductIds, ProductSort } from "@/lib/services/catalog";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}): Promise<Metadata> {
  const params = await searchParams;
  const title = params.q ? `Search: ${params.q} — Indicraft` : params.category ? `${params.category} — Indicraft Shop` : "Shop — Indicraft";
  return { title, description: "Browse handcrafted Indian fabric, home decor, spices and more." };
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const page = params.page ? Math.max(1, Number(params.page)) : 1;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;

  const [categories, filterOptions, wishlisted, result] = await Promise.all([
    getCategories(),
    getFilterOptions(),
    getWishlistedProductIds(userId),
    getProducts(
      {
        category: params.category,
        material: params.material,
        region: params.region,
        minPrice: params.minPrice ? Number(params.minPrice) : undefined,
        maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
        q: params.q,
      },
      (params.sort as ProductSort) ?? "newest",
      page
    ),
  ]);

  const activeCategory = categories.find((c) => c.slug === params.category);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={params.q ? [{ label: `Search: "${params.q}"` }] : activeCategory ? [{ label: "Shop", href: "/shop" }, { label: activeCategory.name }] : [{ label: "Shop" }]} />

      <div className="grid gap-8 md:grid-cols-[220px_1fr]">
        <ShopFilters
          categories={categories}
          min={filterOptions.minPrice}
          max={filterOptions.maxPrice}
          materials={filterOptions.materials}
          regions={filterOptions.regions}
        />

        <div>
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-xl font-bold">
              {params.q ? `Results for "${params.q}" (${result.total})` : `Shop (${result.total})`}
            </h1>
            <SortSelect />
          </div>

          <ActiveFilters />

          {result.items.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {result.items.map((product) => (
                <ProductCard key={product.id} product={product} wishlisted={wishlisted.has(product.id)} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-10 text-center">
              <p className="font-medium">No products found</p>
              <p className="mt-1 text-sm text-muted">
                Nothing matched these filters. Try widening the price range or clearing a filter.
              </p>
              <Link href="/shop" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
                Clear all filters
              </Link>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {categories.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/shop?category=${c.slug}`}
                    className="rounded-full border border-border bg-white px-3 py-1 text-xs hover:border-primary"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <Pagination page={result.page} totalPages={result.totalPages} params={params} />
        </div>
      </div>
    </div>
  );
}
