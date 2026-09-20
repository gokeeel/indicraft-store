"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function SearchBar({ className }: { className?: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");

  return (
    <form
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        if (q.trim()) router.push(`/shop?q=${encodeURIComponent(q.trim())}`);
      }}
    >
      <Search className="h-4 w-4 opacity-50" />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search handcrafted products..."
        className="w-full bg-transparent px-2 py-2 text-sm outline-none"
      />
    </form>
  );
}
