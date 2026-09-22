"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/toast";

export function RemoveItemButton({ itemId }: { itemId: string }) {
  const router = useRouter();
  const { show } = useToast();
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={async () => {
        await fetch(`/api/cart/${itemId}`, { method: "DELETE" });
        show("Removed from cart");
        router.refresh();
      }}
    >
      Remove
    </Button>
  );
}
