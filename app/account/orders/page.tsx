import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

const STATUS_STEPS = ["paid", "processing", "shipped", "delivered"];

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/login");

  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { items: { include: { product: true } }, address: true },
  });

  if (orders.length === 0) {
    return <p className="text-muted">You haven&apos;t placed any orders yet.</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Your Orders</h1>
      {orders.map((order) => (
        <div key={order.id} className="rounded-lg border border-border bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="font-medium">Order #{order.id.slice(-8)}</span>
            <span className="text-muted">{order.createdAt.toLocaleDateString()}</span>
            <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs capitalize">{order.status.replace("_", " ")}</span>
            <span className="font-semibold">{formatPrice(order.total)}</span>
          </div>

          {STATUS_STEPS.includes(order.status) && (
            <div className="mt-3 flex gap-2 text-xs">
              {STATUS_STEPS.map((step) => (
                <span
                  key={step}
                  className={`rounded-full px-2 py-0.5 capitalize ${
                    STATUS_STEPS.indexOf(order.status) >= STATUS_STEPS.indexOf(step)
                      ? "bg-primary text-primary-foreground"
                      : "bg-black/5 text-muted"
                  }`}
                >
                  {step}
                </span>
              ))}
            </div>
          )}

          <ul className="mt-3 space-y-1 text-sm text-muted">
            {order.items.map((item) => (
              <li key={item.id}>
                {item.quantity} × {item.product.name}
              </li>
            ))}
          </ul>

          <p className="mt-3 text-xs text-muted">
            Shipping to: {order.address.name}, {order.address.line1}, {order.address.city}, {order.address.state}{" "}
            {order.address.zip}
          </p>
        </div>
      ))}
    </div>
  );
}
