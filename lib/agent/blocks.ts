import type { ToolResult } from "@/lib/agent/tools";

export type Block =
  | { type: "product_carousel"; products: Extract<ToolResult, { tool: "search_products" }>["products"] }
  | { type: "product_detail"; product: Extract<ToolResult, { tool: "get_product"; product: unknown }>["product"] }
  | { type: "quick_replies"; question: string; options: string[] }
  | {
      type: "cart";
      items: Extract<ToolResult, { tool: "cart"; items: unknown }>["items"];
      subtotal: number;
      shipping: number;
      total: number;
    }
  | { type: "address_picker"; addresses: Extract<ToolResult, { tool: "list_addresses" }>["addresses"] }
  | { type: "address_form" }
  | (Omit<Extract<ToolResult, { tool: "order_summary"; items: unknown }>, "tool"> & { type: "order_summary" })
  // Produced client-side by AgentSidebar after a successful /api/agent/confirm call, not by a
  // model tool — order creation is never something the model can trigger (PRD Section 6).
  | { type: "payment_link"; orderId: string; orderNumber: string; amount: number; url: string };

export function toBlocks(result: ToolResult): Block[] {
  if ("error" in result) return [];

  switch (result.tool) {
    case "search_products":
      return [{ type: "product_carousel", products: result.products }];
    case "get_product":
      return "product" in result ? [{ type: "product_detail", product: result.product }] : [];
    case "ask_user":
      return [{ type: "quick_replies", question: result.question, options: result.options }];
    case "cart":
      return "items" in result
        ? [{ type: "cart", items: result.items, subtotal: result.subtotal, shipping: result.shipping, total: result.total }]
        : [];
    case "list_addresses":
      return [{ type: "address_picker", addresses: result.addresses }];
    case "request_new_address":
      return [{ type: "address_form" }];
    case "order_summary":
      return "items" in result
        ? [
            {
              type: "order_summary",
              items: result.items,
              address: result.address,
              subtotal: result.subtotal,
              shipping: result.shipping,
              total: result.total,
              confirmToken: result.confirmToken,
              expiresAt: result.expiresAt,
            },
          ]
        : [];
    default:
      return [];
  }
}
