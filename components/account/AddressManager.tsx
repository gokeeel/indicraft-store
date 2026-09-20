"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AddressForm, AddressFormValues } from "@/components/checkout/AddressForm";

type Address = AddressFormValues & { id: string };

export function AddressManager({ addresses }: { addresses: Address[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function createAddress(values: AddressFormValues) {
    await fetch("/api/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setAdding(false);
    router.refresh();
  }

  async function updateAddress(id: string, values: AddressFormValues) {
    await fetch(`/api/addresses/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setEditingId(null);
    router.refresh();
  }

  async function deleteAddress(id: string) {
    await fetch(`/api/addresses/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {addresses.map((a) =>
        editingId === a.id ? (
          <div key={a.id} className="rounded-lg border border-border bg-white p-4">
            <AddressForm initial={a} onSubmit={(values) => updateAddress(a.id, values)} submitLabel="Update Address" />
          </div>
        ) : (
          <div key={a.id} className="flex items-start justify-between rounded-lg border border-border bg-white p-4 text-sm">
            <div>
              <p className="font-medium">
                {a.name} {a.isDefault && <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">Default</span>}
              </p>
              <p className="text-muted">{a.phone}</p>
              <p className="text-muted">
                {a.line1}, {a.city}, {a.state} {a.zip}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditingId(a.id)}>
                Edit
              </Button>
              <Button variant="ghost" size="sm" onClick={() => deleteAddress(a.id)}>
                Delete
              </Button>
            </div>
          </div>
        )
      )}

      {adding ? (
        <div className="rounded-lg border border-border bg-white p-4">
          <AddressForm onSubmit={createAddress} />
        </div>
      ) : (
        <Button variant="outline" onClick={() => setAdding(true)}>
          + Add New Address
        </Button>
      )}
    </div>
  );
}
