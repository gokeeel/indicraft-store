import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orderId } = await params;
  const order = await prisma.order.findFirst({ where: { id: orderId, userId } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  // Idempotent: re-posting to an already-paid order just confirms the current state.
  if (order.status === "paid") return NextResponse.json({ ok: true, status: order.status });

  await prisma.$transaction([
    prisma.order.update({ where: { id: order.id }, data: { status: "paid" } }),
    prisma.payment.upsert({
      where: { orderId: order.id },
      update: { status: "paid" },
      create: { orderId: order.id, provider: "mock", status: "paid", amount: order.total },
    }),
  ]);

  return NextResponse.json({ ok: true, status: "paid" });
}
