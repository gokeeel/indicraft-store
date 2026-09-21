import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPaymentLinkSignature } from "@/lib/agent/razorpay";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const paymentId = params.get("razorpay_payment_id");
  const paymentLinkId = params.get("razorpay_payment_link_id");
  const referenceId = params.get("razorpay_payment_link_reference_id");
  const status = params.get("razorpay_payment_link_status");
  const signature = params.get("razorpay_signature");

  if (!paymentId || !paymentLinkId || !referenceId || !status || !signature) {
    return NextResponse.redirect(new URL("/account/orders?payment=invalid", req.url));
  }

  const valid = verifyPaymentLinkSignature({
    paymentLinkId,
    paymentLinkReferenceId: referenceId,
    paymentLinkStatus: status,
    paymentId,
    signature,
  });

  if (!valid) {
    return NextResponse.redirect(new URL("/account/orders?payment=invalid", req.url));
  }

  // reference_id was set to our own order ID when the link was created (lib/agent/razorpay.ts).
  const order = await prisma.order.findUnique({ where: { id: referenceId } });
  if (!order) {
    return NextResponse.redirect(new URL("/account/orders?payment=not_found", req.url));
  }

  if (status === "paid" && order.status !== "paid") {
    await prisma.$transaction([
      prisma.order.update({ where: { id: order.id }, data: { status: "paid" } }),
      prisma.payment.upsert({
        where: { orderId: order.id },
        update: { status: "paid" },
        create: { orderId: order.id, provider: "razorpay", status: "paid", amount: order.total },
      }),
    ]);
  }

  return NextResponse.redirect(new URL("/account/orders?payment=success", req.url));
}
