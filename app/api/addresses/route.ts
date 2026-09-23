import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma, withDb } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(1),
  phone: z.string().min(6),
  line1: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  zip: z.string().min(3),
  isDefault: z.boolean().optional(),
});

async function requireUserId() {
  const session = await getServerSession(authOptions);
  return (session?.user as { id?: string } | undefined)?.id;
}

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const result = await withDb(() => prisma.address.findMany({ where: { userId }, orderBy: { isDefault: "desc" } }));
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 503 });
  return NextResponse.json(result.data);
}

export async function POST(req: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const result = await withDb(async () => {
    if (parsed.data.isDefault) {
      await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    return prisma.address.create({ data: { ...parsed.data, userId } });
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 503 });
  return NextResponse.json(result.data, { status: 201 });
}
