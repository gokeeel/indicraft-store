import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
            <li>Fabric</li>
            <li>Home Decor</li>
            <li>Spices</li>
            <li>Mugs</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold">Company</h4>
          <ul className="space-y-2 text-sm text-muted">
            <li>Our Artisans</li>
            <li>Contact</li>
            <li>Vendor Sign Up</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold">Newsletter</h4>
          <form className="flex gap-2">
            <Input type="email" placeholder="Your email" />
            <Button type="submit">Join</Button>
          </form>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} Indicraft. All rights reserved.
      </div>
    </footer>
  );
}
