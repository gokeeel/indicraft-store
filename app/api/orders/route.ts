import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCart } from "@/lib/services/catalog";
import { clearCart } from "@/lib/services/cart";

const schema = z.object({ addressId: z.string(), couponCode: z.string().trim().optional() });

const TAX_RATE = 0.05;
const FREE_SHIPPING_THRESHOLD = 999;
const SHIPPING_FLAT_RATE = 99;

async function requireUserId() {
  const session = await getServerSession(authOptions);
  return (session?.user as { id?: string } | undefined)?.id;
}

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { items: { include: { product: true } }, address: true },
  });
  return NextResponse.json(orders);
}

export async function POST(req: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const address = await prisma.address.findFirst({ where: { id: parsed.data.addressId, userId } });
  if (!address) return NextResponse.json({ error: "Address not found" }, { status: 404 });

  const cart = await getCart(userId);
  if (!cart || cart.items.length === 0) return NextResponse.json({ error: "Cart is empty" }, { status: 400 });

  const subtotal = cart.items.reduce(
    (sum, item) => sum + Number(item.product.salePrice ?? item.product.price) * item.quantity,
    0
  );

  let discount = 0;
  let couponCode: string | undefined;
  if (parsed.data.couponCode) {
    const coupon = await prisma.coupon.findUnique({ where: { code: parsed.data.couponCode.toUpperCase() } });
    if (!coupon || !coupon.active) {
      return NextResponse.json({ error: "Invalid or inactive coupon code" }, { status: 400 });
    }
    discount = Math.round(subtotal * (coupon.percentOff / 100) * 100) / 100;
    couponCode = coupon.code;
  }

  const shipping = subtotal - discount >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT_RATE;
  const taxable = subtotal - discount;
  const tax = Math.round(taxable * TAX_RATE * 100) / 100;
  const total = taxable + tax + shipping;

  const order = await prisma.order.create({
    data: {
      userId,
      addressId: address.id,
      subtotal,
      discount,
      couponCode,
      shipping,
      tax,
      total,
      status: "pending_payment",
      items: {
        create: cart.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.product.salePrice ?? item.product.price,
        })),
      },
    },
    include: { items: true },
  });

  await clearCart(userId);

  return NextResponse.json(order, { status: 201 });
}
