import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { removeFromCart } from "@/lib/services/cart";

export async function DELETE(_req: Request, { params }: { params: Promise<{ itemId: string }> }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { itemId } = await params;
  await removeFromCart(userId, itemId);
  return NextResponse.json({ ok: true });
}
