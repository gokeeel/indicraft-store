import { prisma } from "@/lib/prisma";

async function getOrCreateCart(userId: string) {
  const existing = await prisma.cart.findFirst({ where: { userId } });
  if (existing) return existing;
  return prisma.cart.create({ data: { userId } });
}

export async function addToCart(userId: string, productId: string, quantity = 1) {
  const cart = await getOrCreateCart(userId);
  return prisma.cartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId } },
    update: { quantity: { increment: quantity } },
    create: { cartId: cart.id, productId, quantity },
  });
}

export async function removeFromCart(userId: string, itemId: string) {
  const cart = await getOrCreateCart(userId);
  return prisma.cartItem.deleteMany({ where: { id: itemId, cartId: cart.id } });
}

export async function clearCart(userId: string) {
  const cart = await getOrCreateCart(userId);
  return prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
}
