import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createOrderFromCart, OrderCreationError, isRetryableTransactionError } from "@/lib/services/orders";

const schema = z.object({ addressId: z.string() });

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
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  try {
    const order = await createOrderFromCart(userId, parsed.data.addressId);
    return NextResponse.json(order, { status: 201 });
  } catch (err) {
    if (err instanceof OrderCreationError) return NextResponse.json({ error: err.message }, { status: 400 });
    if (isRetryableTransactionError(err)) return NextResponse.json({ error: "Please try again." }, { status: 409 });
    throw err;
  }
}
