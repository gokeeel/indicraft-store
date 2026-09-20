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
    };

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
    default:
      return [];
  }
}
