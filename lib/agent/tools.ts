import { z } from "zod";
import { getProducts, getProductById } from "@/lib/services/catalog";
import type { ToolSchema } from "@/lib/agent/sarvam";

export type ToolContext = { userId: string };

const searchProductsArgs = z.object({
  query: z.string().max(200).optional(),
  category: z.string().max(100).optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  material: z.string().max(100).optional(),
  region: z.string().max(100).optional(),
  occasion: z.string().max(100).optional(),
  limit: z.number().int().min(1).max(8).optional().default(8),
});

const getProductArgs = z.object({
  productId: z.string(),
});

// Sarvam's tool-calling API is OpenAI-compatible: {type:"function", function:{name, description, parameters}}
// where parameters is a JSON Schema object. Kept hand-written since only two tools exist in Phase 1.
export const TOOL_SCHEMAS: ToolSchema[] = [
  {
    type: "function",
    function: {
      name: "search_products",
      description:
        "Search Indicraft's handcrafted product catalog. Use when the user wants to browse or find products by keyword, category, price range, material, region, or occasion.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Free-text search across name, description, material, region" },
          category: { type: "string", description: "Category slug: fabric, home-decor, household, mugs, spices, uncategorized" },
          minPrice: { type: "number" },
          maxPrice: { type: "number" },
          material: { type: "string" },
          region: { type: "string" },
          occasion: { type: "string" },
          limit: { type: "number", description: "Max results to return, 1-8. Defaults to 8." },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_product",
      description: "Get full details for a single product by its ID, including images, material, region, and vendor.",
      parameters: {
        type: "object",
        properties: { productId: { type: "string", description: "The product's database ID" } },
        required: ["productId"],
      },
    },
  },
];

export type ToolResult =
  | { tool: "search_products"; products: Awaited<ReturnType<typeof getProducts>>["items"] }
  | { tool: "get_product"; product: NonNullable<Awaited<ReturnType<typeof getProductById>>> }
  | { tool: "get_product"; error: string }
  | { error: string };

export async function runTool(name: string, rawArgs: unknown, _ctx: ToolContext): Promise<ToolResult> {
  switch (name) {
    case "search_products": {
      const args = searchProductsArgs.parse(rawArgs ?? {});
      const result = await getProducts(
        {
          category: args.category,
          material: args.material,
          region: args.region,
          occasion: args.occasion,
          minPrice: args.minPrice,
          maxPrice: args.maxPrice,
          q: args.query,
        },
        "newest",
        1,
        args.limit
      );
      return { tool: "search_products", products: result.items };
    }
    case "get_product": {
      const args = getProductArgs.parse(rawArgs);
      const product = await getProductById(args.productId);
      if (!product) return { tool: "get_product", error: "Product not found" };
      return { tool: "get_product", product };
    }
    default:
      return { error: `Unknown tool: ${name}` };
  }
}
