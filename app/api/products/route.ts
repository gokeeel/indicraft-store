import { NextRequest, NextResponse } from "next/server";
import { getProducts, ProductSort } from "@/lib/services/catalog";

const VALID_SORTS: ProductSort[] = ["price_asc", "price_desc", "newest"];

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const sortParam = params.get("sort") ?? "newest";
  const sort = (VALID_SORTS as string[]).includes(sortParam) ? (sortParam as ProductSort) : "newest";

  const result = await getProducts(
    {
      category: params.get("category") ?? undefined,
      material: params.get("material") ?? undefined,
      region: params.get("region") ?? undefined,
      minPrice: params.get("minPrice") ? Number(params.get("minPrice")) : undefined,
      maxPrice: params.get("maxPrice") ? Number(params.get("maxPrice")) : undefined,
    },
    sort,
    params.get("page") ? Number(params.get("page")) : 1
  );

  return NextResponse.json(result);
}
