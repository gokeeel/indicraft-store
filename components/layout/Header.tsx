import Link from "next/link";
import { Search, User, ShoppingBag } from "lucide-react";
import { MobileNav } from "@/components/layout/MobileNav";

const NAV_LINKS = [
  { href: "/shop", label: "Shop" },
  { href: "/shop?category=fabric", label: "Fabric" },
  { href: "/shop?category=home-decor", label: "Home Decor" },
  { href: "/shop?category=spices", label: "Spices" },
];

export function Header({ cartCount = 0 }: { cartCount?: number }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <MobileNav links={NAV_LINKS} />

        <Link href="/" className="text-xl font-bold text-primary">
          Indicraft
        </Link>

        <nav className="ml-6 hidden gap-6 text-sm font-medium md:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-primary">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden max-w-sm flex-1 items-center rounded-md border border-border px-3 md:flex">
          <Search className="h-4 w-4 opacity-50" />
          <input
            type="search"
            placeholder="Search handcrafted products..."
            className="w-full bg-transparent px-2 py-2 text-sm outline-none"
          />
        </div>

        <Link href="/account/orders" className="ml-auto md:ml-4 p-2 hover:text-primary" aria-label="Account">
          <User className="h-5 w-5" />
        </Link>

        <Link href="/cart" className="relative p-2 hover:text-primary" aria-label="Cart">
          <ShoppingBag className="h-5 w-5" />
          {cartCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
              {cartCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
