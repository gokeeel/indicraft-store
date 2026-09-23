import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma, withDb } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const { name, email, password } = parsed.data;

  const result = await withDb(async () => {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return "conflict" as const;
    const hashed = await bcrypt.hash(password, 10);
    // All public signups are customers. Vendor accounts are created by an admin (seeded manually for now).
    return prisma.user.create({ data: { name, email, password: hashed, role: "customer" } });
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 503 });
  if (result.data === "conflict") return NextResponse.json({ error: "Email already registered" }, { status: 409 });

  return NextResponse.json({ id: result.data.id, email: result.data.email }, { status: 201 });
}
