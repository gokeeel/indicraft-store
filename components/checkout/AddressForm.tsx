"use client";

import { cloneElement, useId, useState, type ReactElement } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Placeholder text disappears the moment a user types into the field, so it can't stand in for
// a real label (WCAG / UX_STANDARDS.md Section 22.4: "Labels remain visible").
function Field({ label, children }: { label: string; children: ReactElement<{ id?: string }> }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-muted">
        {label} <span aria-hidden="true">*</span>
      </label>
      {cloneElement(children, { id })}
    </div>
  );
}

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
      <Field label="Full name">
        <Input required autoComplete="name" value={values.name} onChange={(e) => set("name", e.target.value)} />
      </Field>
      <Field label="Phone number">
        <Input required type="tel" autoComplete="tel" value={values.phone} onChange={(e) => set("phone", e.target.value)} />
      </Field>
      <Field label="Address">
        <Input required autoComplete="address-line1" value={values.line1} onChange={(e) => set("line1", e.target.value)} />
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="City">
          <Input required autoComplete="address-level2" value={values.city} onChange={(e) => set("city", e.target.value)} />
        </Field>
        <Field label="State">
          <Input required autoComplete="address-level1" value={values.state} onChange={(e) => set("state", e.target.value)} />
        </Field>
        <Field label="PIN code">
          <Input required autoComplete="postal-code" value={values.zip} onChange={(e) => set("zip", e.target.value)} />
        </Field>
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
