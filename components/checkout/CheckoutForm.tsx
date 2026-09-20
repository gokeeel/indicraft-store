"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AddressForm, AddressFormValues } from "@/components/checkout/AddressForm";
import { formatPrice } from "@/lib/utils";
import { computeCartTotals } from "@/lib/services/pricing";

type Address = { id: string; name: string; line1: string; city: string; state: string; zip: string };

export function CheckoutForm({ addresses, subtotal }: { addresses: Address[]; subtotal: number }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(addresses[0]?.id ?? null);
  const [addingNew, setAddingNew] = useState(addresses.length === 0);
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");

  const { shipping, tax, total } = useMemo(() => computeCartTotals(subtotal), [subtotal]);

  async function saveNewAddress(values: AddressFormValues) {
    const res = await fetch("/api/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (res.ok) {
      const address = await res.json();
      setSelectedId(address.id);
      setAddingNew(false);
      router.refresh();
    }
  }

  async function placeOrder() {
    if (!selectedId) {
      setError("Please select or add a shipping address.");
      return;
    }
    setPlacing(true);
    setError("");
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addressId: selectedId }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not place order.");
      setPlacing(false);
      return;
    }
    router.push("/account/orders");
    router.refresh();
  }

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <section>
          <h2 className="mb-3 font-semibold">Shipping Address</h2>
          <div className="space-y-2">
            {addresses.map((a) => (
              <label
                key={a.id}
                className="flex items-start gap-3 rounded-md border border-border p-3 text-sm has-[:checked]:border-primary"
              >
                <input
                  type="radio"
                  name="address"
                  checked={selectedId === a.id}
                  onChange={() => setSelectedId(a.id)}
                />
                <span>
                  <span className="font-medium">{a.name}</span> — {a.line1}, {a.city}, {a.state} {a.zip}
                </span>
              </label>
            ))}
          </div>
          {!addingNew ? (
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setAddingNew(true)}>
              + Add new address
            </Button>
          ) : (
            <div className="mt-3">
              <AddressForm onSubmit={saveNewAddress} />
            </div>
          )}
        </section>

        <section>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={billingSameAsShipping}
              onChange={(e) => setBillingSameAsShipping(e.target.checked)}
            />
            Billing address same as shipping
          </label>
        </section>
      </div>

      <div className="h-fit space-y-2 rounded-lg border border-border bg-white p-4">
        <h2 className="font-semibold">Order Summary</h2>
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Shipping</span>
          <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Tax (5%)</span>
          <span>{formatPrice(tax)}</span>
        </div>
        <div className="flex justify-between border-t border-border pt-2 font-semibold">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
        <p className="pt-2 text-xs text-muted">Payment will be added here later.</p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button className="w-full" onClick={placeOrder} disabled={placing}>
          {placing ? "Placing Order..." : "Place Order"}
        </Button>
      </div>
    </div>
  );
}
