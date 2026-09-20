"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export function SortSelect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <Select
      value={searchParams.get("sort") ?? "newest"}
      onValueChange={(v) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("sort", v);
        params.delete("page");
        router.push(`/shop?${params.toString()}`);
      }}
    >
      <SelectTrigger className="w-48">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="newest">Newest</SelectItem>
        <SelectItem value="price_asc">Price: Low to High</SelectItem>
        <SelectItem value="price_desc">Price: High to Low</SelectItem>
      </SelectContent>
    </Select>
  );
}
