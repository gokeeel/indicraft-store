"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const MATERIALS = ["Cotton", "Silk", "Brass (Dhokra)", "Terracotta", "Copper", "Jute", "Wool-Cotton"];
const REGIONS = ["Rajasthan", "Kerala", "West Bengal", "Gujarat", "Bihar", "Karnataka", "Assam"];

export function ShopFilters({
  categories,
  min,
  max,
}: {
  categories: { name: string; slug: string; _count: { products: number } }[];
  min: number;
  max: number;
}) {
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
    <aside className="space-y-6">
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
            {MATERIALS.map((m) => (
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
            {REGIONS.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </aside>
  );
}
