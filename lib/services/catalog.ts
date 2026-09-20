import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export type ProductFilter = {
  category?: string;
  material?: string;
  region?: string;
  minPrice?: number;
  maxPrice?: number;
};

export type ProductSort = "price_asc" | "price_desc" | "newest";

export async function getProducts(
  filter: ProductFilter = {},
  sort: ProductSort = "newest",
  page = 1,
  pageSize = 12
) {
  const where: Prisma.ProductWhereInput = {};
  if (filter.category) where.category = { slug: filter.category };
  if (filter.material) where.material = filter.material;
  if (filter.region) where.region = filter.region;
  if (filter.minPrice != null || filter.maxPrice != null) {
    where.price = {};
    if (filter.minPrice != null) where.price.gte = filter.minPrice;
    if (filter.maxPrice != null) where.price.lte = filter.maxPrice;
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sort === "price_asc" ? { price: "asc" } : sort === "price_desc" ? { price: "desc" } : { createdAt: "desc" };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { images: true, category: true },
    }),
    prisma.product.count({ where }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    include: { images: true, category: true, vendor: true },
  });
}

export async function getRelatedProducts(categoryId: string, excludeId: string, take = 4) {
  return prisma.product.findMany({
    where: { categoryId, id: { not: excludeId } },
    include: { images: true, category: true },
    take,
  });
}

export async function getCategories() {
  return prisma.category.findMany({
    include: { _count: { select: { products: true } } },
  });
}

export async function getCart(userId: string) {
  return prisma.cart.findFirst({
    where: { userId },
    include: { items: { include: { product: { include: { images: true } } } } },
  });
}
