import Link from "next/link";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCart } from "@/lib/services/catalog";
import { cartSubtotal, computeCartTotals } from "@/lib/services/pricing";
import { Button } from "@/components/ui/button";
import { PriceDisplay } from "@/components/product/PriceDisplay";
import { RemoveItemButton } from "@/components/cart/RemoveItemButton";
import { QuantityStepper } from "@/components/cart/QuantityStepper";
import { formatPrice } from "@/lib/utils";

export default async function CartPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="mb-4">Please log in to view your cart.</p>
        <Button asChild>
          <Link href="/login">Log In</Link>
        </Button>
      </div>
    );
  }

  const cart = await getCart(userId);
  const items = cart?.items ?? [];

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="mb-4">Your cart is empty.</p>
        <Button asChild>
          <Link href="/shop">Continue Shopping</Link>
        </Button>
      </div>
    );
  }

  const { subtotal, shipping, tax, total } = computeCartTotals(cartSubtotal(items));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-xl font-bold">Your Cart</h1>
      <div className="grid gap-8 md:grid-cols-[1fr_300px]">
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item.id} className="flex gap-4 rounded-lg border border-border bg-white p-4">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md">
                {item.product.images[0] && (
                  <Image src={item.product.images[0].url} alt={item.product.name} fill sizes="80px" className="object-cover" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <Link href={`/product/${item.product.slug}`} className="font-medium hover:text-primary">
                  {item.product.name}
                </Link>
                {item.product.artisan && <p className="text-xs text-muted">By {item.product.artisan}</p>}
                <PriceDisplay price={item.product.price} salePrice={item.product.salePrice} />
                <QuantityStepper itemId={item.id} quantity={item.quantity} stock={item.product.stock} />
              </div>
              <div className="flex flex-col items-end justify-between">
                <p className="font-semibold">
                  {formatPrice(
                    parseFloat((item.product.salePrice ?? item.product.price).toString()) * item.quantity
                  )}
                </p>
                <RemoveItemButton itemId={item.id} />
              </div>
            </li>
          ))}
        </ul>

        <div className="h-fit space-y-2 rounded-lg border border-border bg-white p-4">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Shipping</span>
            <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Tax (5%)</span>
            <span>{formatPrice(tax)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2 font-semibold">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
          <Button asChild className="mt-4 w-full">
            <Link href="/checkout">Checkout</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
