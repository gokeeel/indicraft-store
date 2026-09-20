import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCart } from "@/lib/services/catalog";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  const cart = userId ? await getCart(userId) : null;
  const cartCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  return (
    <>
      <Header cartCount={cartCount} />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
