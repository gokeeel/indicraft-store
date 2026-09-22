export default function ShopLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-4 h-5 w-40 animate-pulse rounded bg-black/10" />
      <div className="grid gap-8 md:grid-cols-[220px_1fr]">
        <div className="hidden space-y-4 md:block">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-md bg-black/10" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i}>
              <div className="aspect-square animate-pulse rounded-lg bg-black/10" />
              <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-black/10" />
              <div className="mt-1.5 h-4 w-1/3 animate-pulse rounded bg-black/10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
