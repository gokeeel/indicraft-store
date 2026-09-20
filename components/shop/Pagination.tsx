import Link from "next/link";
import { cn } from "@/lib/utils";

export function Pagination({
  page,
  totalPages,
  params,
}: {
  page: number;
  totalPages: number;
  params: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  function hrefFor(p: number) {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (key === "page" || !value) continue;
      search.set(key, value);
    }
    search.set("page", String(p));
    return `/shop?${search.toString()}`;
  }

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav className="mt-8 flex items-center justify-center gap-1 text-sm">
      <Link
        href={hrefFor(Math.max(1, page - 1))}
        aria-disabled={page === 1}
        className={cn("rounded-md border border-border px-3 py-1.5", page === 1 && "pointer-events-none opacity-40")}
      >
        Prev
      </Link>
      {pages.map((p) => (
        <Link
          key={p}
          href={hrefFor(p)}
          className={cn(
            "rounded-md border px-3 py-1.5",
            p === page ? "border-primary bg-primary text-primary-foreground" : "border-border"
          )}
        >
          {p}
        </Link>
      ))}
      <Link
        href={hrefFor(Math.min(totalPages, page + 1))}
        aria-disabled={page === totalPages}
        className={cn(
          "rounded-md border border-border px-3 py-1.5",
          page === totalPages && "pointer-events-none opacity-40"
        )}
      >
        Next
      </Link>
    </nav>
  );
}
