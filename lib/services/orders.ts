import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { cartSubtotal, computeCartTotals } from "@/lib/services/pricing";
import { hashCartItems } from "@/lib/services/cart";

export class OrderCreationError extends Error {}

export type CreateOrderOptions = {
  /** If given, the order is rejected unless the cart's current contents still hash to this
   *  value — used by the agent confirm flow to detect the cart changing since preview. */
  expectedCartHash?: string;
};

/**
 * Creates a pending_payment order from the user's current cart and clears the cart, all inside
 * one Serializable transaction. That's what makes this safe against double-clicks/replays: two
 * concurrent calls can't both see the same not-yet-cleared cart, and a replayed confirm token's
 * cartHash won't match the (now-empty) cart on the second attempt.
 */
export async function createOrderFromCart(
  userId: string,
  addressId: string,
  options: CreateOrderOptions = {}
) {
  return prisma.$transaction(
    async (tx) => {
      const address = await tx.address.findFirst({ where: { id: addressId, userId } });
      if (!address) throw new OrderCreationError("Address not found");

      const cart = await tx.cart.findFirst({
        where: { userId },
        include: { items: { include: { product: true } } },
      });
      const items = cart?.items ?? [];
      if (items.length === 0) throw new OrderCreationError("Your cart is empty");

      if (options.expectedCartHash) {
        const currentHash = hashCartItems(items.map((i) => ({ productId: i.productId, quantity: i.quantity })));
        if (currentHash !== options.expectedCartHash) {
          throw new OrderCreationError("Your cart changed since you last reviewed it — please check it again.");
        }
      }

      for (const item of items) {
        if (item.quantity > item.product.stock) {
          throw new OrderCreationError(`Only ${item.product.stock} left of ${item.product.name} — please update your cart.`);
        }
      }

      const { subtotal, shipping, tax, total } = computeCartTotals(cartSubtotal(items));

      const order = await tx.order.create({
        data: {
          userId,
          addressId,
          subtotal,
          shipping,
          tax,
          total,
          status: "pending_payment",
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.salePrice ?? item.product.price,
            })),
          },
        },
        include: { items: true },
      });

      await tx.cartItem.deleteMany({ where: { cartId: cart!.id } });

      return order;
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      // Prisma's 5s default is too tight for this DB's occasional latency spikes (pooled
      // serverless Postgres) — the transaction itself does little work, it's round-trip time
      // that blows the budget.
      timeout: 15000,
    }
  );
}

/** True for Postgres serialization failures under concurrent Serializable transactions — the
 *  caller should tell the user to retry rather than treat this as a hard error. */
export function isRetryableTransactionError(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2034";
}

/** Recent orders for "where is my order?" -- both the /account/orders page and the agent's
 *  track_orders tool (UX_STANDARDS.md Section 14/21.4) read from this single source. */
export async function getRecentOrders(userId: string, take = 5) {
  return prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
    include: { items: { include: { product: true } }, address: true },
  });
}
