"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Sheet, SheetTrigger, SheetContent, SheetTitle } from "@/components/ui/sheet";

type ShopFiltersProps = {
  categories: { name: string; slug: string; _count: { products: number } }[];
  min: number;
  max: number;
  materials: string[];
  regions: string[];
};

function FilterFields({ categories, min, max, materials, regions }: ShopFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [price, setPrice] = useState<[number, number]>([
    Number(searchParams.get("minPrice") ?? min),
    Number(searchParams.get("maxPrice") ?? max),
  ]);

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`/shop?${params.toString()}`);
  }

  const activeCategory = searchParams.get("category") ?? "";

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 font-semibold">Category</h3>
        <ul className="space-y-1 text-sm">
          <li>
            <button
              className={activeCategory === "" ? "font-semibold text-primary" : "text-muted"}
              onClick={() => updateParam("category", null)}
            >
              All
            </button>
          </li>
          {categories.map((c) => (
            <li key={c.slug}>
              <button
                className={activeCategory === c.slug ? "font-semibold text-primary" : "text-muted"}
                onClick={() => updateParam("category", c.slug)}
              >
                {c.name} ({c._count.products})
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="mb-2 font-semibold">Price: ₹{price[0]} – ₹{price[1]}</h3>
        <Slider
          min={min}
          max={max}
          step={50}
          value={price}
          onValueChange={(v) => setPrice(v as [number, number])}
          onValueCommit={(v) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set("minPrice", String(v[0]));
            params.set("maxPrice", String(v[1]));
            params.delete("page");
            router.push(`/shop?${params.toString()}`);
          }}
        />
      </div>

      <div>
        <h3 className="mb-2 font-semibold">Material</h3>
        <Select value={searchParams.get("material") ?? undefined} onValueChange={(v) => updateParam("material", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Any material" />
          </SelectTrigger>
          <SelectContent>
            {materials.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <h3 className="mb-2 font-semibold">Region</h3>
        <Select value={searchParams.get("region") ?? undefined} onValueChange={(v) => updateParam("region", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Any region" />
          </SelectTrigger>
          <SelectContent>
            {regions.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export function ShopFilters(props: ShopFiltersProps) {
  return (
    <>
      {/* Section 23: "Filters can open in a bottom sheet or drawer" on mobile -- the sidebar
          layout only ever existed at md+, so filters were previously just missing below that,
          not merely hidden-and-recoverable. */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </SheetTrigger>
          <SheetContent className="max-w-xs overflow-y-auto">
            <SheetTitle className="mb-4 text-lg font-bold">Filters</SheetTitle>
            <FilterFields {...props} />
          </SheetContent>
        </Sheet>
      </div>
      <aside className="hidden md:block">
        <FilterFields {...props} />
      </aside>
    </>
  );
}
