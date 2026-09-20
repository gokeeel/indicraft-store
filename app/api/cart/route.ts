import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { getCart } from "@/lib/services/catalog";
import { addToCart } from "@/lib/services/cart";

const addSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive().default(1),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cart = await getCart(userId);
  return NextResponse.json(cart ?? { items: [] });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = addSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const item = await addToCart(userId, parsed.data.productId, parsed.data.quantity);
  return NextResponse.json(item, { status: 201 });
}
