import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { removeFromCart, updateCartItemQuantity } from "@/lib/services/cart";

async function requireUserId() {
  const session = await getServerSession(authOptions);
  return (session?.user as { id?: string } | undefined)?.id;
}

const patchSchema = z.object({ quantity: z.number().int().min(1).max(10) });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { itemId } = await params;
  const result = await updateCartItemQuantity(userId, itemId, parsed.data.quantity);
  if (!result.ok) {
    const status = result.reason === "not_found" ? 404 : 409;
    const message = result.reason === "not_found" ? "Cart item not found" : `Only ${result.available} left in stock`;
    return NextResponse.json({ error: message, reason: result.reason, available: result.available }, { status });
  }
  return NextResponse.json(result.item);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ itemId: string }> }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { itemId } = await params;
  await removeFromCart(userId, itemId);
  return NextResponse.json({ ok: true });
}
