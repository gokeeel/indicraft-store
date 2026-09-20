import { prisma } from "@/lib/prisma";

async function getOrCreateCart(userId: string) {
  const existing = await prisma.cart.findFirst({ where: { userId } });
  if (existing) return existing;
  return prisma.cart.create({ data: { userId } });
}

export type CartMutationResult =
  | { ok: true; item: Awaited<ReturnType<typeof prisma.cartItem.upsert>> }
  | { ok: false; reason: "out_of_stock" | "not_found"; available?: number };

export async function addToCart(userId: string, productId: string, quantity = 1): Promise<CartMutationResult> {
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { stock: true } });
  if (!product) return { ok: false, reason: "not_found" };

  const cart = await getOrCreateCart(userId);
  const existingItem = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } },
  });
  const desiredQuantity = (existingItem?.quantity ?? 0) + quantity;

  if (desiredQuantity > product.stock) {
    return { ok: false, reason: "out_of_stock", available: product.stock };
  }

  const item = await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId } },
    update: { quantity: desiredQuantity },
    create: { cartId: cart.id, productId, quantity: desiredQuantity },
  });
  return { ok: true, item };
}

export async function updateCartItemQuantity(
  userId: string,
  itemId: string,
  quantity: number
): Promise<CartMutationResult> {
  const cart = await getOrCreateCart(userId);
  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, cartId: cart.id },
    include: { product: { select: { stock: true } } },
  });
  if (!item) return { ok: false, reason: "not_found" };
  if (quantity > item.product.stock) {
    return { ok: false, reason: "out_of_stock", available: item.product.stock };
  }

  const updated = await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
  return { ok: true, item: updated };
}

export async function removeFromCart(userId: string, itemId: string) {
  const cart = await getOrCreateCart(userId);
  return prisma.cartItem.deleteMany({ where: { id: itemId, cartId: cart.id } });
}

export async function clearCart(userId: string) {
  const cart = await getOrCreateCart(userId);
  return prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
}
