"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";

const FILTER_KEYS = ["category", "material", "region", "minPrice", "maxPrice", "q"] as const;
const LABELS: Record<(typeof FILTER_KEYS)[number], string> = {
  category: "Category",
  material: "Material",
  region: "Region",
  minPrice: "Min",
  maxPrice: "Max",
  q: "Search",
};

export function ActiveFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const active = FILTER_KEYS.filter((key) => searchParams.get(key)).map((key) => ({
    key,
    label: `${LABELS[key]}: ${searchParams.get(key)}`,
  }));

  if (active.length === 0) return null;

  function remove(key: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    params.delete("page");
    router.push(`/shop?${params.toString()}`);
  }

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {active.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => remove(key)}
          className="flex items-center gap-1 rounded-full border border-border bg-white px-3 py-1 text-xs hover:border-primary"
        >
          {label}
          <X className="h-3 w-3" />
        </button>
      ))}
    </div>
  );
}
