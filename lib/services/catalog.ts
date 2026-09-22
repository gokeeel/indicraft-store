import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { cartSubtotal, computeCartTotals } from "@/lib/services/pricing";

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
    // Section 7.1 requires search to cover product name, category, material, region, and
    // artisan/craft terminology -- category and artisan were missing entirely, so e.g.
    // searching "spices" or an artisan's name returned nothing.
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { material: { contains: q, mode: "insensitive" } },
      { region: { contains: q, mode: "insensitive" } },
      { artisan: { contains: q, mode: "insensitive" } },
      { category: { name: { contains: q, mode: "insensitive" } } },
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

// Every filter shown in the UI must actually match real product data (UX_STANDARDS.md
// Section 8.4) -- a hardcoded list drifts the moment products are added/changed, silently
// turning into a decorative filter for whatever isn't in the list.
export async function getFilterOptions() {
  const [materials, regions, priceRange] = await Promise.all([
    prisma.product.findMany({ where: { material: { not: null } }, select: { material: true }, distinct: ["material"] }),
    prisma.product.findMany({ where: { region: { not: null } }, select: { region: true }, distinct: ["region"] }),
    prisma.product.aggregate({ _min: { price: true }, _max: { price: true } }),
  ]);
  return {
    materials: materials.map((m) => m.material!).sort(),
    regions: regions.map((r) => r.region!).sort(),
    minPrice: Math.floor(Number(priceRange._min.price ?? 0)),
    maxPrice: Math.ceil(Number(priceRange._max.price ?? 10000)),
  };
}

export async function getWishlistedProductIds(userId: string | undefined): Promise<Set<string>> {
  if (!userId) return new Set();
  const items = await prisma.wishlistItem.findMany({ where: { userId }, select: { productId: true } });
  return new Set(items.map((i) => i.productId));
}

export async function getWishlist(userId: string) {
  return prisma.wishlistItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { product: { include: { images: true, category: true } } },
  });
}

export async function addToWishlist(userId: string, productId: string) {
  await prisma.wishlistItem.upsert({
    where: { userId_productId: { userId, productId } },
    update: {},
    create: { userId, productId },
  });
}

export async function removeFromWishlist(userId: string, productId: string) {
  await prisma.wishlistItem.deleteMany({ where: { userId, productId } });
}

export async function getCart(userId: string) {
  return prisma.cart.findFirst({
    where: { userId },
    include: { items: { include: { product: { include: { images: true } } } } },
  });
}

export async function getCartSummary(userId: string) {
  const cart = await getCart(userId);
  const items = cart?.items ?? [];
  const totals = computeCartTotals(cartSubtotal(items));

  return {
    items: items.map((item) => ({
      id: item.id,
      productId: item.productId,
      name: item.product.name,
      slug: item.product.slug,
      image: item.product.images[0]?.url ?? null,
      price: item.product.price,
      salePrice: item.product.salePrice,
      quantity: item.quantity,
      stock: item.product.stock,
    })),
    ...totals,
  };
}
