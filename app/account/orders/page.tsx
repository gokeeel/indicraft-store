import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { formatPrice } from "@/lib/utils";
import { getRecentOrders } from "@/lib/services/orders";
import { PayNowButton } from "@/components/account/PayNowButton";

const STATUS_STEPS = ["paid", "processing", "shipped", "delivered"];

const PAYMENT_BANNERS: Record<string, { text: string; tone: "success" | "error" }> = {
  success: { text: "Payment successful — thank you!", tone: "success" },
  invalid: { text: "That payment link couldn't be verified. If you were charged, contact support.", tone: "error" },
  not_found: { text: "We couldn't find that order.", tone: "error" },
};

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/login");

  const { payment } = await searchParams;
  const banner = payment ? PAYMENT_BANNERS[payment] : undefined;

  const orders = await getRecentOrders(userId, 50);

  if (orders.length === 0) {
    return <p className="text-muted">You haven&apos;t placed any orders yet.</p>;
  }

  return (
    <div className="space-y-6">
      {banner && (
        <p
          className={`rounded-md px-3 py-2 text-sm ${
            banner.tone === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {banner.text}
        </p>
      )}
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

          {order.status === "pending_payment" && (
            <div className="mt-3">
              <PayNowButton orderId={order.id} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
