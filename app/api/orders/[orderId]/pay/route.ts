import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPaymentProvider } from "@/lib/agent/payments";

// Regenerates a payment link for an existing pending order -- recovery path for a user who
// navigated away from checkout before paying (payment links aren't stored, so this creates a
// fresh one rather than assuming the original is still valid).
export async function POST(_req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orderId } = await params;
  const order = await prisma.order.findFirst({ where: { id: orderId, userId } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.status !== "pending_payment") {
    return NextResponse.json({ error: "This order isn't awaiting payment." }, { status: 400 });
  }

  const provider = getPaymentProvider();
  const payment = await provider.createPaymentLink({ orderId: order.id, amount: Number(order.total) });
  return NextResponse.json({ paymentUrl: payment.url });
}
