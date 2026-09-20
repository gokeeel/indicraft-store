import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="border-b border-border p-4">
        <Link href="/" className="text-xl font-bold text-primary">
          Indicraft
        </Link>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}
