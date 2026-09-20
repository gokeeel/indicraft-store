import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")?.trim().toUpperCase();
  if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });

  const coupon = await prisma.coupon.findUnique({ where: { code } });
  if (!coupon || !coupon.active) {
    return NextResponse.json({ error: "Invalid or inactive coupon code" }, { status: 404 });
  }
  return NextResponse.json({ code: coupon.code, percentOff: coupon.percentOff });
}
