"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddressForm, AddressFormValues } from "@/components/checkout/AddressForm";
import { formatPrice } from "@/lib/utils";

type Address = { id: string; name: string; line1: string; city: string; state: string; zip: string };

const TAX_RATE = 0.05;
const FREE_SHIPPING_THRESHOLD = 999;
const SHIPPING_FLAT_RATE = 99;

export function CheckoutForm({ addresses, subtotal }: { addresses: Address[]; subtotal: number }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(addresses[0]?.id ?? null);
  const [addingNew, setAddingNew] = useState(addresses.length === 0);
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");

  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; percentOff: number } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [checkingCoupon, setCheckingCoupon] = useState(false);

  const { discount, shipping, tax, total } = useMemo(() => {
    const discount = coupon ? Math.round(subtotal * (coupon.percentOff / 100) * 100) / 100 : 0;
    const taxable = subtotal - discount;
    const shipping = taxable >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT_RATE;
    const tax = Math.round(taxable * TAX_RATE * 100) / 100;
    return { discount, shipping, tax, total: taxable + tax + shipping };
  }, [subtotal, coupon]);

  async function applyCoupon() {
    if (!couponInput.trim()) return;
    setCheckingCoupon(true);
    setCouponError("");
    const res = await fetch(`/api/coupons/validate?code=${encodeURIComponent(couponInput.trim())}`);
    setCheckingCoupon(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setCouponError(data.error ?? "Invalid coupon code.");
      setCoupon(null);
      return;
    }
    const data = await res.json();
    setCoupon(data);
  }

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
      body: JSON.stringify({ addressId: selectedId, couponCode: coupon?.code }),
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

        <section>
          <h2 className="mb-2 font-semibold">Coupon</h2>
          <div className="flex gap-2">
            <Input
              placeholder="Coupon code"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
            />
            <Button type="button" variant="outline" onClick={applyCoupon} disabled={checkingCoupon}>
              {checkingCoupon ? "Checking..." : "Apply"}
            </Button>
          </div>
          {coupon && <p className="mt-1 text-xs text-green-700">{coupon.code} applied — {coupon.percentOff}% off</p>}
          {couponError && <p className="mt-1 text-xs text-red-600">{couponError}</p>}
        </section>
      </div>

      <div className="h-fit space-y-2 rounded-lg border border-border bg-white p-4">
        <h2 className="font-semibold">Order Summary</h2>
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-sm text-green-700">
            <span>Discount</span>
            <span>-{formatPrice(discount)}</span>
          </div>
        )}
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
