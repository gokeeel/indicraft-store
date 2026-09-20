"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Sheet, SheetTrigger, SheetContent, SheetTitle } from "@/components/ui/sheet";

export function MobileNav({ links }: { links: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="p-2 md:hidden" aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent className="max-w-xs">
        <SheetTitle className="mb-4 text-lg font-bold text-primary">Indicraft</SheetTitle>
        <nav className="flex flex-col gap-4">
          {links.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="text-base font-medium">
              {link.label}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
