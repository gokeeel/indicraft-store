import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createOrderFromCart, OrderCreationError, isRetryableTransactionError } from "@/lib/services/orders";
import { getPaymentProvider } from "@/lib/agent/payments";

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
    // The traditional checkout page skipped this entirely (left as "Payment will be added
    // here later") -- an order placed through it became permanently stuck in
    // pending_payment with no way to pay, anywhere in the UI. Same payment-link generation
    // the agent's confirm flow already does (lib/agent/confirm.ts).
    const provider = getPaymentProvider();
    const payment = await provider.createPaymentLink({ orderId: order.id, amount: Number(order.total) });
    return NextResponse.json({ ...order, paymentUrl: payment.url }, { status: 201 });
  } catch (err) {
    if (err instanceof OrderCreationError) return NextResponse.json({ error: err.message }, { status: 400 });
    if (isRetryableTransactionError(err)) return NextResponse.json({ error: "Please try again." }, { status: 409 });
    throw err;
  }
}
