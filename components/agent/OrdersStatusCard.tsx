import { formatPrice } from "@/lib/utils";
import type { Block } from "@/lib/agent/blocks";

const STATUS_STEPS = ["paid", "processing", "shipped", "delivered"];

export function OrdersStatusCard({ orders }: { orders: Extract<Block, { type: "orders" }>["orders"] }) {
  if (orders.length === 0) {
    return <p className="mt-2 text-sm text-muted">You haven&apos;t placed any orders yet.</p>;
  }

  return (
    <div className="mt-2 space-y-3 rounded-lg border border-border bg-white p-3">
      {orders.map((order) => (
        <div key={order.id} className="border-b border-border pb-3 last:border-0 last:pb-0">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">Order #{order.id.slice(-8).toUpperCase()}</span>
            <span className="rounded-full bg-black/5 px-2 py-0.5 capitalize">{order.status.replace("_", " ")}</span>
          </div>
          <p className="mt-1 text-xs text-muted">
            {order.items.map((i) => i.product.name).join(", ")} · {formatPrice(order.total)}
          </p>
          {STATUS_STEPS.includes(order.status) && (
            <div className="mt-2 flex gap-1">
              {STATUS_STEPS.map((step) => (
                <span
                  key={step}
                  className={`h-1 flex-1 rounded-full ${
                    STATUS_STEPS.indexOf(order.status) >= STATUS_STEPS.indexOf(step) ? "bg-primary" : "bg-black/10"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
