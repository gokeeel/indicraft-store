import { RazorpayProvider } from "@/lib/agent/razorpay";

export interface PaymentProvider {
  createPaymentLink(input: { orderId: string; amount: number }): Promise<{ url: string }>;
}

/** Local mock — used whenever Razorpay keys aren't configured (e.g. local dev without them). */
export class MockProvider implements PaymentProvider {
  async createPaymentLink({ orderId }: { orderId: string; amount: number }) {
    return { url: `/pay/mock/${orderId}` };
  }
}

export function getPaymentProvider(): PaymentProvider {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    return new RazorpayProvider();
  }
  return new MockProvider();
}
