import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { PayMockButton } from "@/components/PayMockButton";
import { formatPrice } from "@/lib/utils";

export default async function MockPaymentPage({ params }: { params: Promise<{ orderId: string }> }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/login");

  const { orderId } = await params;
  const order = await prisma.order.findFirst({ where: { id: orderId, userId } });
  if (!order) notFound();

  const isPaid = order.status === "paid";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f7f5f2] px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-white p-6 text-center shadow-sm">
        <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
          TEST MODE — no real payment
        </span>
        <h1 className="mt-4 text-lg font-bold">
          Order #{order.id.slice(-8).toUpperCase()}
        </h1>
        <p className="mt-1 text-2xl font-semibold">{formatPrice(order.total)}</p>

        {isPaid ? (
          <>
            <p className="mt-4 text-sm text-green-700">Payment complete! This order is now paid.</p>
            <Button asChild className="mt-4 w-full">
              <Link href="/account/orders">View Your Orders</Link>
            </Button>
          </>
        ) : (
          <div className="mt-4">
            <PayMockButton orderId={order.id} />
          </div>
        )}
      </div>
    </div>
  );
}
