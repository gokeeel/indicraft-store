import type { Decimal } from "@prisma/client/runtime/library";

export type Money = number | string | Decimal;

export type ProductSummary = {
  id: string;
  slug: string;
  name: string;
  price: Money;
  salePrice: Money | null;
  stock: number;
  category: { name: string; slug: string };
  images: { url: string; altText: string | null }[];
};
