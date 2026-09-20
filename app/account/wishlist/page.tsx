import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/product/ProductCard";

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
    return <p className="text-muted">Nothing saved yet. Tap the heart on a product to save it here.</p>;
  }

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">Your Wishlist</h1>
      <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
        {items.map((item) => (
          <ProductCard key={item.id} product={item.product} />
        ))}
      </div>
    </div>
  );
}
