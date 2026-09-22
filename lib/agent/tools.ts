import { z } from "zod";
import { getProducts, getProductById, getCartSummary, getWishlist, addToWishlist, removeFromWishlist } from "@/lib/services/catalog";
import { addToCart, updateCartItemQuantity, removeFromCart } from "@/lib/services/cart";
import { getAddresses } from "@/lib/services/addresses";
import { buildOrderPreview, type OrderPreview } from "@/lib/agent/preview";
import { getRecentOrders } from "@/lib/services/orders";
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

const askUserArgs = z.object({
  question: z.string().max(300),
  options: z.array(z.string().max(60)).min(2).max(6),
});

const addToCartArgs = z.object({
  productId: z.string(),
  quantity: z.number().int().min(1).max(10).optional().default(1),
});

const updateCartItemArgs = z.object({
  itemId: z.string(),
  quantity: z.number().int().min(1).max(10),
});

const removeCartItemArgs = z.object({
  itemId: z.string(),
});

const previewOrderArgs = z.object({
  addressId: z.string(),
});

const wishlistProductArgs = z.object({
  productId: z.string(),
});

// Sarvam's tool-calling API is OpenAI-compatible: {type:"function", function:{name, description, parameters}}
// where parameters is a JSON Schema object. Kept hand-written since the tool count is still small.
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
  {
    type: "function",
    function: {
      name: "ask_user",
      description:
        "REQUIRED whenever you want to ask the user a clarifying question before searching (e.g. budget, occasion, material, region) — for example when they ask for a gift idea, or say something is too vague to search yet. You must call this tool instead of asking in plain text: plain-text questions do not render as tappable options and break the UI. Give 2-6 short options.",
      parameters: {
        type: "object",
        properties: {
          question: { type: "string" },
          options: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 6 },
        },
        required: ["question", "options"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_to_cart",
      description: "Add a product to the user's cart. Rejected automatically if it would exceed available stock.",
      parameters: {
        type: "object",
        properties: {
          productId: { type: "string" },
          quantity: { type: "number", description: "1-10, defaults to 1" },
        },
        required: ["productId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "view_cart",
      description: "Get the user's current cart: items, subtotal, shipping, and total.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "update_cart_item",
      description: "Change the quantity of an item already in the cart. Rejected if it would exceed stock.",
      parameters: {
        type: "object",
        properties: {
          itemId: { type: "string", description: "The cart item's ID (not the product ID)" },
          quantity: { type: "number", description: "1-10" },
        },
        required: ["itemId", "quantity"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "remove_cart_item",
      description: "Remove an item from the cart entirely.",
      parameters: {
        type: "object",
        properties: { itemId: { type: "string", description: "The cart item's ID (not the product ID)" } },
        required: ["itemId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_addresses",
      description: "Get the user's saved shipping addresses, for choosing one at checkout.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "request_new_address",
      description:
        "Show the user a form to add a new shipping address. Call this when they want to check out and have no saved address, or want to use a different one. Takes no arguments and returns no data — never try to fill in the address fields yourself, the user types them into the form.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "preview_order",
      description:
        "Compute the final order total for a given saved address and show the user an order summary to confirm. Creates nothing yet — the user must tap Confirm in the app. Requires the cart to be non-empty and the address to belong to the user.",
      parameters: {
        type: "object",
        properties: { addressId: { type: "string", description: "One of the user's saved address IDs" } },
        required: ["addressId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "view_wishlist",
      description: "Get the user's saved/wishlisted products. Use for 'show my wishlist' or 'what have I saved'.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "add_to_wishlist",
      description: "Save a product to the user's wishlist for later. Use for 'save this for later' or 'add to my wishlist'.",
      parameters: {
        type: "object",
        properties: { productId: { type: "string" } },
        required: ["productId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "remove_from_wishlist",
      description: "Remove a product from the user's wishlist.",
      parameters: {
        type: "object",
        properties: { productId: { type: "string" } },
        required: ["productId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "track_orders",
      description:
        "Get the user's recent orders with their current status (pending payment, paid, processing, shipped, delivered, etc.). Use this whenever they ask about an existing order — e.g. 'where is my order', 'has it shipped', 'did my payment go through'.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
];

type CartSummary = Awaited<ReturnType<typeof getCartSummary>>;

export type ToolResult =
  | { tool: "search_products"; products: Awaited<ReturnType<typeof getProducts>>["items"] }
  | { tool: "get_product"; product: NonNullable<Awaited<ReturnType<typeof getProductById>>> }
  | { tool: "get_product"; error: string }
  | { tool: "ask_user"; question: string; options: string[] }
  | ({ tool: "cart" } & CartSummary)
  | { tool: "cart"; error: string; available?: number }
  | { tool: "list_addresses"; addresses: Awaited<ReturnType<typeof getAddresses>> }
  | { tool: "request_new_address" }
  | ({ tool: "order_summary" } & OrderPreview)
  | { tool: "order_summary"; error: string }
  | { tool: "orders"; orders: Awaited<ReturnType<typeof getRecentOrders>> }
  | { tool: "view_wishlist"; products: Awaited<ReturnType<typeof getWishlist>>[number]["product"][] }
  | { tool: "wishlist_ack"; action: "added" | "removed" }
  | { error: string };

function stockErrorMessage(reason: "out_of_stock" | "not_found", available?: number) {
  return reason === "not_found" ? "Product not found" : `Only ${available} left in stock`;
}

export async function runTool(name: string, rawArgs: unknown, ctx: ToolContext): Promise<ToolResult> {
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
    case "ask_user": {
      const args = askUserArgs.parse(rawArgs);
      return { tool: "ask_user", question: args.question, options: args.options };
    }
    case "add_to_cart": {
      const args = addToCartArgs.parse(rawArgs);
      const result = await addToCart(ctx.userId, args.productId, args.quantity);
      if (!result.ok) {
        return { tool: "cart", error: stockErrorMessage(result.reason, result.available), available: result.available };
      }
      const cart = await getCartSummary(ctx.userId);
      return { tool: "cart", ...cart };
    }
    case "view_cart": {
      const cart = await getCartSummary(ctx.userId);
      return { tool: "cart", ...cart };
    }
    case "update_cart_item": {
      const args = updateCartItemArgs.parse(rawArgs);
      const result = await updateCartItemQuantity(ctx.userId, args.itemId, args.quantity);
      if (!result.ok) {
        return { tool: "cart", error: stockErrorMessage(result.reason, result.available), available: result.available };
      }
      const cart = await getCartSummary(ctx.userId);
      return { tool: "cart", ...cart };
    }
    case "remove_cart_item": {
      const args = removeCartItemArgs.parse(rawArgs);
      await removeFromCart(ctx.userId, args.itemId);
      const cart = await getCartSummary(ctx.userId);
      return { tool: "cart", ...cart };
    }
    case "list_addresses": {
      const addresses = await getAddresses(ctx.userId);
      return { tool: "list_addresses", addresses };
    }
    case "request_new_address": {
      return { tool: "request_new_address" };
    }
    case "preview_order": {
      const args = previewOrderArgs.parse(rawArgs);
      const result = await buildOrderPreview(ctx.userId, args.addressId);
      if (!result.ok) return { tool: "order_summary", error: result.error };
      return { tool: "order_summary", ...result.preview };
    }
    case "track_orders": {
      const orders = await getRecentOrders(ctx.userId);
      return { tool: "orders", orders };
    }
    case "view_wishlist": {
      const items = await getWishlist(ctx.userId);
      return { tool: "view_wishlist", products: items.map((i) => i.product) };
    }
    case "add_to_wishlist": {
      const args = wishlistProductArgs.parse(rawArgs);
      await addToWishlist(ctx.userId, args.productId);
      return { tool: "wishlist_ack", action: "added" };
    }
    case "remove_from_wishlist": {
      const args = wishlistProductArgs.parse(rawArgs);
      await removeFromWishlist(ctx.userId, args.productId);
      return { tool: "wishlist_ack", action: "removed" };
    }
    default:
      return { error: `Unknown tool: ${name}` };
  }
}
