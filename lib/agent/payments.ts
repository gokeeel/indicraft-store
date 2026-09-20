export interface PaymentProvider {
  createPaymentLink(input: { orderId: string; amount: number }): Promise<{ url: string }>;
}

/** Local mock — no real payment integration yet. Wired up in Phase 6 with a real
 *  RazorpayProvider once test keys exist (see PRD.md Section 15). */
export class MockProvider implements PaymentProvider {
  async createPaymentLink({ orderId }: { orderId: string; amount: number }) {
    return { url: `/pay/mock/${orderId}` };
  }
}

export function getPaymentProvider(): PaymentProvider {
  return new MockProvider();
}
