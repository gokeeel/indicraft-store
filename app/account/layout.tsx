import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCart } from "@/lib/services/catalog";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  const cart = userId ? await getCart(userId) : null;
  const cartCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  return (
    <>
      <Header cartCount={cartCount} />
      <main className="mx-auto flex max-w-7xl flex-1 gap-8 px-4 py-8">
        <aside className="w-48 shrink-0 space-y-2 text-sm">
          <Link href="/account" className="block hover:text-primary">
            Overview
          </Link>
          <Link href="/account/orders" className="block hover:text-primary">
            Orders
          </Link>
          <Link href="/account/addresses" className="block hover:text-primary">
            Addresses
          </Link>
          <Link href="/account/wishlist" className="block hover:text-primary">
            Wishlist
          </Link>
        </aside>
        <div className="flex-1">{children}</div>
      </main>
      <Footer />
    </>
  );
}
