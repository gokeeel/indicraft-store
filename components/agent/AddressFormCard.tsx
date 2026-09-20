"use client";

import { AddressForm, type AddressFormValues } from "@/components/checkout/AddressForm";

export function AddressFormCard({ onCreated }: { onCreated: (addressId: string) => void }) {
  return (
    <div className="mt-2 rounded-lg border border-border bg-white p-3">
      <AddressForm
        submitLabel="Save & Continue"
        onSubmit={async (values: AddressFormValues) => {
          const res = await fetch("/api/addresses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(values),
          });
          if (res.ok) {
            const address = await res.json();
            onCreated(address.id);
          }
        }}
      />
    </div>
  );
}
