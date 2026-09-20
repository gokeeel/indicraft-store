import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export type ProductFilter = {
  category?: string;
  material?: string;
  region?: string;
  minPrice?: number;
  maxPrice?: number;
  occasion?: string;
  q?: string;
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
  if (filter.occasion) where.occasion = filter.occasion;
  if (filter.minPrice != null || filter.maxPrice != null) {
    where.price = {};
    if (filter.minPrice != null) where.price.gte = filter.minPrice;
    if (filter.maxPrice != null) where.price.lte = filter.maxPrice;
  }
  if (filter.q) {
    const q = filter.q;
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { material: { contains: q, mode: "insensitive" } },
      { region: { contains: q, mode: "insensitive" } },
    ];
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

export async function getProductById(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: { images: true, category: true, vendor: true },
  });
}

export async function getProductReviews(productId: string) {
  const [reviews, agg] = await Promise.all([
    prisma.review.findMany({
      where: { productId },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true } } },
    }),
    prisma.review.aggregate({ where: { productId }, _avg: { rating: true }, _count: true }),
  ]);
  return { reviews, average: agg._avg.rating ?? 0, count: agg._count };
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
