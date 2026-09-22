"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function PayNowButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function pay() {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/orders/${orderId}/pay`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setLoading(false);
      setError(typeof data.error === "string" ? data.error : "Couldn't start payment.");
      return;
    }
    window.location.href = data.paymentUrl;
  }

  return (
    <div>
      <Button onClick={pay} disabled={loading} size="sm">
        {loading ? "Starting payment..." : "Pay Now"}
      </Button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
