import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Package, MapPin, Heart } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SignOutButton } from "@/components/account/SignOutButton";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/login");

  const [orderCount, addressCount, wishlistCount] = await Promise.all([
    prisma.order.count({ where: { userId } }),
    prisma.address.count({ where: { userId } }),
    prisma.wishlistItem.count({ where: { userId } }),
  ]);

  const links = [
    { href: "/account/orders", label: "Orders", count: orderCount, icon: Package },
    { href: "/account/addresses", label: "Addresses", count: addressCount, icon: MapPin },
    { href: "/account/wishlist", label: "Wishlist", count: wishlistCount, icon: Heart },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-white p-6">
        <div>
          <h1 className="text-xl font-bold">{session?.user?.name ?? "Your Account"}</h1>
          <p className="text-sm text-muted">{session?.user?.email}</p>
        </div>
        <SignOutButton />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {links.map(({ href, label, count, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col gap-2 rounded-lg border border-border bg-white p-5 hover:border-primary"
          >
            <Icon className="h-5 w-5 text-primary" />
            <span className="font-medium">{label}</span>
            <span className="text-sm text-muted">{count} {count === 1 ? "item" : "items"}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
