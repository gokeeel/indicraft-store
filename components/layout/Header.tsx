import Link from "next/link";
import Image from "next/image";
import { User, ShoppingBag, Heart } from "lucide-react";
import { MobileNav } from "@/components/layout/MobileNav";
import { SearchBar } from "@/components/layout/SearchBar";
import { AgentToggleButton } from "@/components/agent/AgentToggleButton";

const NAV_LINKS = [
  { href: "/shop", label: "Shop" },
  { href: "/shop?category=fabric", label: "Fabric" },
  { href: "/shop?category=home-decor", label: "Home Decor" },
  { href: "/shop?category=household", label: "Household" },
  { href: "/shop?category=mugs", label: "Mugs" },
  { href: "/shop?category=spices", label: "Spices" },
];

export function Header({ cartCount = 0 }: { cartCount?: number }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <MobileNav links={NAV_LINKS} />

        <Link href="/" className="flex items-center gap-1.5 text-xl font-bold text-primary">
          <Image src="/images/logo-mark.png" alt="" width={24} height={24} className="rounded-sm" />
          Indicraft
        </Link>

        <nav className="ml-6 hidden gap-6 text-sm font-medium md:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-primary">
              {link.label}
            </Link>
          ))}
        </nav>

        <SearchBar className="ml-auto hidden max-w-sm flex-1 items-center rounded-md border border-border px-3 md:flex" />

        <AgentToggleButton />

        <Link href="/account/wishlist" className="ml-auto p-2 hover:text-primary md:ml-0" aria-label="Wishlist">
          <Heart className="h-5 w-5" />
        </Link>

        <Link href="/account" className="p-2 hover:text-primary" aria-label="Account">
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
