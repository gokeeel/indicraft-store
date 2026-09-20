import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCart } from "@/lib/services/catalog";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";

const TAX_RATE = 0.05;

export default async function CheckoutPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/login");

  const [cart, addresses] = await Promise.all([
    getCart(userId),
    prisma.address.findMany({ where: { userId }, orderBy: { isDefault: "desc" } }),
  ]);

  const items = cart?.items ?? [];
  if (items.length === 0) redirect("/cart");

  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.product.salePrice ?? item.product.price) * item.quantity,
    0
  );
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-xl font-bold">Checkout</h1>
      <CheckoutForm addresses={addresses} subtotal={subtotal} tax={tax} total={total} />
    </div>
  );
}
