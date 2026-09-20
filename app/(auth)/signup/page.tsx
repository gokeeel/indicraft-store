"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState<"customer" | "vendor">("customer");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error?.message ?? "Could not sign up. Try a different email.");
      return;
    }
    await signIn("credentials", { email, password, redirect: false });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-6 text-xl font-bold">Create Account</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input placeholder="Full name" required value={name} onChange={(e) => setName(e.target.value)} />
        <Input type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input
          type="password"
          placeholder="Password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Input
          type="password"
          placeholder="Confirm password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />

        <div className="flex gap-2">
          {(["customer", "vendor"] as const).map((r) => (
            <button
              type="button"
              key={r}
              onClick={() => setRole(r)}
              className={cn(
                "flex-1 rounded-md border border-border py-2 text-sm capitalize",
                role === r && "border-primary bg-primary/10 text-primary"
              )}
            >
              {r}
            </button>
          ))}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full">
          Sign Up
        </Button>
      </form>
      <p className="mt-4 text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
