import type { ToolResult } from "@/lib/agent/tools";

export type Block =
  | { type: "product_carousel"; products: Extract<ToolResult, { tool: "search_products" }>["products"] }
  | { type: "product_detail"; product: Extract<ToolResult, { tool: "get_product"; product: unknown }>["product"] };

export function toBlocks(toolName: string, result: ToolResult): Block[] {
  if ("error" in result) return [];

  switch (toolName) {
    case "search_products":
      return result.tool === "search_products" ? [{ type: "product_carousel", products: result.products }] : [];
    case "get_product":
      return result.tool === "get_product" && "product" in result
        ? [{ type: "product_detail", product: result.product }]
        : [];
    default:
      return [];
  }
}
