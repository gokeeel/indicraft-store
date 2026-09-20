"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function RemoveItemButton({ itemId }: { itemId: string }) {
  const router = useRouter();
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={async () => {
        await fetch(`/api/cart/${itemId}`, { method: "DELETE" });
        router.refresh();
      }}
    >
      Remove
    </Button>
  );
}
