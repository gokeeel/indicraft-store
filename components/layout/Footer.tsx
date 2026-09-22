import Link from "next/link";
import { NewsletterForm } from "@/components/layout/NewsletterForm";

const SHOP_LINKS = [
  { href: "/shop?category=fabric", label: "Fabric" },
  { href: "/shop?category=home-decor", label: "Home Decor" },
  { href: "/shop?category=household", label: "Household" },
  { href: "/shop?category=mugs", label: "Mugs" },
  { href: "/shop?category=spices", label: "Spices" },
];

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-4">
        <div>
          <h3 className="mb-3 text-lg font-bold text-primary">Indicraft</h3>
          <p className="text-sm text-muted">Handcrafted goods made by Indian artisans, delivered to your door.</p>
        </div>
        <div>
          <h4 className="mb-3 font-semibold">Shop</h4>
          <ul className="space-y-2 text-sm text-muted">
            {SHOP_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-primary">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold">Company</h4>
          <ul className="space-y-2 text-sm text-muted">
            <li>
              <a href="mailto:hello@indicraft.example" className="hover:text-primary">
                Contact
              </a>
            </li>
            {/* Our Artisans / Vendor Sign Up: not yet built (Sections 17 & 19) -- not linked
                as real navigation until those pages exist. */}
            <li className="text-muted/60">Our Artisans (coming soon)</li>
            <li className="text-muted/60">Vendor Sign Up (coming soon)</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold">Newsletter</h4>
          <NewsletterForm />
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} Indicraft. All rights reserved.
      </div>
    </footer>
  );
}
