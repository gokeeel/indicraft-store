"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export type AddressFormValues = {
  name: string;
  phone: string;
  line1: string;
  city: string;
  state: string;
  zip: string;
  isDefault?: boolean;
};

export function AddressForm({
  initial,
  onSubmit,
  submitLabel = "Save Address",
}: {
  initial?: Partial<AddressFormValues>;
  onSubmit: (values: AddressFormValues) => Promise<void> | void;
  submitLabel?: string;
}) {
  const [values, setValues] = useState<AddressFormValues>({
    name: initial?.name ?? "",
    phone: initial?.phone ?? "",
    line1: initial?.line1 ?? "",
    city: initial?.city ?? "",
    state: initial?.state ?? "",
    zip: initial?.zip ?? "",
    isDefault: initial?.isDefault ?? false,
  });
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof AddressFormValues>(key: K, value: AddressFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setSubmitting(true);
        await onSubmit(values);
        setSubmitting(false);
      }}
    >
      <Input placeholder="Full name" required value={values.name} onChange={(e) => set("name", e.target.value)} />
      <Input placeholder="Phone number" required value={values.phone} onChange={(e) => set("phone", e.target.value)} />
      <Input placeholder="Address" required value={values.line1} onChange={(e) => set("line1", e.target.value)} />
      <div className="grid grid-cols-3 gap-3">
        <Input placeholder="City" required value={values.city} onChange={(e) => set("city", e.target.value)} />
        <Input placeholder="State" required value={values.state} onChange={(e) => set("state", e.target.value)} />
        <Input placeholder="PIN code" required value={values.zip} onChange={(e) => set("zip", e.target.value)} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={values.isDefault} onChange={(e) => set("isDefault", e.target.checked)} />
        Set as default address
      </label>
      <Button type="submit" disabled={submitting}>
        {submitting ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
