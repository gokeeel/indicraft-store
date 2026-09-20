"use client";

import { formatPrice } from "@/lib/utils";

export function PaymentCard({
  orderNumber,
  amount,
  url,
}: {
  orderId: string;
  orderNumber: string;
  amount: number;
  url: string;
}) {
  return (
    <div className="mt-2 space-y-2 rounded-lg border border-border bg-white p-3 text-xs">
      <span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
        TEST MODE
      </span>
      <p className="text-sm font-semibold">Order #{orderNumber} created</p>
      <p className="text-muted">Awaiting payment — {formatPrice(amount)}</p>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="mt-1 block w-full rounded-md bg-primary px-3 py-2 text-center text-xs font-medium text-primary-foreground hover:opacity-90"
      >
        Pay Now
      </a>
    </div>
  );
}
