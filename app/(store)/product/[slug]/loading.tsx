export default function ProductLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-4 h-4 w-64 animate-pulse rounded bg-black/10" />
      <div className="grid gap-10 md:grid-cols-2">
        <div className="aspect-square animate-pulse rounded-lg bg-black/10" />
        <div className="space-y-4">
          <div className="h-7 w-3/4 animate-pulse rounded bg-black/10" />
          <div className="h-4 w-1/3 animate-pulse rounded bg-black/10" />
          <div className="h-6 w-24 animate-pulse rounded bg-black/10" />
          <div className="h-20 animate-pulse rounded bg-black/10" />
          <div className="h-10 w-40 animate-pulse rounded bg-black/10" />
        </div>
      </div>
    </div>
  );
}
