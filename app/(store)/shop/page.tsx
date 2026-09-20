import type { Metadata } from "next";
import { ProductCard } from "@/components/product/ProductCard";
import { ShopFilters } from "@/components/shop/ShopFilters";
import { SortSelect } from "@/components/shop/SortSelect";
import { Pagination } from "@/components/shop/Pagination";
import { getCategories, getProducts, ProductSort } from "@/lib/services/catalog";

const MIN_PRICE = 350;
const MAX_PRICE = 6800;

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

  const [categories, result] = await Promise.all([
    getCategories(),
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid gap-8 md:grid-cols-[220px_1fr]">
        <ShopFilters categories={categories} min={MIN_PRICE} max={MAX_PRICE} />

        <div>
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-xl font-bold">
              {params.q ? `Results for "${params.q}" (${result.total})` : `Shop (${result.total})`}
            </h1>
            <SortSelect />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {result.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {result.items.length === 0 && <p className="text-muted">No products match these filters.</p>}

          <Pagination page={result.page} totalPages={result.totalPages} params={params} />
        </div>
      </div>
    </div>
  );
}
