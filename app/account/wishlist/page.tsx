import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";

export default async function WishlistPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/login");

  const items = await prisma.wishlistItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { product: { include: { images: true, category: true } } },
  });

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-10 text-center">
        <p className="font-medium">Nothing saved yet</p>
        <p className="mt-1 text-sm text-muted">Tap the heart on any product to save it here for later.</p>
        <Button asChild className="mt-4">
          <Link href="/shop">Browse the shop</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">Your Wishlist</h1>
      <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
        {items.map((item) => (
          // Every item on this page is, by definition, already wishlisted -- without this,
          // ProductCard defaults wishlisted to false and shows a hollow heart on its own list.
          <ProductCard key={item.id} product={item.product} wishlisted />
        ))}
      </div>
    </div>
  );
}
