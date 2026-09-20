import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { userHasPurchased } from "@/lib/services/catalog";

const schema = z.object({
  productId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const purchased = await userHasPurchased(userId, parsed.data.productId);
  if (!purchased) {
    return NextResponse.json({ error: "You can only review products you've purchased" }, { status: 403 });
  }

  const review = await prisma.review.upsert({
    where: { userId_productId: { userId, productId: parsed.data.productId } },
    update: { rating: parsed.data.rating, comment: parsed.data.comment },
    create: { userId, productId: parsed.data.productId, rating: parsed.data.rating, comment: parsed.data.comment },
  });
  return NextResponse.json(review, { status: 201 });
}
