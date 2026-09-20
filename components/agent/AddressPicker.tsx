"use client";

type Address = { id: string; name: string; line1: string; city: string; state: string; zip: string };

export function AddressPicker({
  addresses,
  onSelect,
  onAddNew,
}: {
  addresses: Address[];
  onSelect: (addressId: string) => void;
  onAddNew: () => void;
}) {
  return (
    <div className="mt-2 space-y-2">
      {addresses.map((a) => (
        <button
          key={a.id}
          type="button"
          onClick={() => onSelect(a.id)}
          className="block w-full rounded-md border border-border bg-white p-2 text-left text-xs hover:border-primary"
        >
          <span className="font-medium">{a.name}</span> — {a.line1}, {a.city}, {a.state} {a.zip}
        </button>
      ))}
      <button type="button" onClick={onAddNew} className="text-xs font-medium text-primary hover:underline">
        + Add a new address
      </button>
    </div>
  );
}
