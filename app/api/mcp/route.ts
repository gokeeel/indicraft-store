import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import * as z from "zod4";
import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { runTool } from "@/lib/agent/tools";
import { getOrCreateGuestUser } from "@/lib/services/guestSession";
import { buildOrderPreview } from "@/lib/agent/preview";
import { confirmOrder } from "@/lib/agent/confirm";
import { checkRateLimit } from "@/lib/agent/rateLimit";
import { prisma } from "@/lib/prisma";

// Lets Claude/ChatGPT shop Indicraft without an account. Every tool below just calls the same
// services the logged-in in-app agent (lib/agent/tools.ts) uses — the only new piece is mapping
// an MCP sessionId to a throwaway guest User row (lib/services/guestSession.ts), since Cart/
// Order/Address are all keyed by a real userId in the schema.

function textResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data) }] };
}

async function withSession(sessionId: string | undefined) {
  const sid = sessionId || randomUUID();
  const userId = await getOrCreateGuestUser(sid);
  const limit = checkRateLimit(userId);
  if (!limit.allowed) throw new Error(`Rate limit exceeded — retry in ${limit.retryAfterSeconds}s`);
  return { sid, userId };
}

const sessionIdField = z
  .string()
  .optional()
  .describe(
    "The sessionId returned by a previous call in this conversation. Omit on the first cart/checkout call — the result includes a new sessionId; reuse it for every later call so the cart persists."
  );

const handler = createMcpHandler(() => {
  const server = new McpServer({ name: "indicraft", version: "1.0.0" });

  server.registerTool(
    "search_products",
    {
      description:
        "Search Indicraft's handcrafted product catalog by keyword, category, price range, material, region, or occasion.",
      inputSchema: z.object({
        query: z.string().max(200).optional(),
        category: z.string().max(100).optional().describe("fabric, home-decor, household, mugs, spices, uncategorized"),
        minPrice: z.number().min(0).optional(),
        maxPrice: z.number().min(0).optional(),
        material: z.string().max(100).optional(),
        region: z.string().max(100).optional(),
        occasion: z.string().max(100).optional(),
        limit: z.number().int().min(1).max(8).optional(),
      }),
    },
    async (args) => textResult(await runTool("search_products", args, { userId: "" }))
  );

  server.registerTool(
    "get_product",
    {
      description: "Get full details for a single product by its ID, including images, material, region, and vendor.",
      inputSchema: z.object({ productId: z.string() }),
    },
    async (args) => textResult(await runTool("get_product", args, { userId: "" }))
  );

  server.registerTool(
    "add_to_cart",
    {
      description:
        "Add a product to the session's cart. Rejected if it would exceed stock. Returns the sessionId — reuse it for every later cart/checkout call.",
      inputSchema: z.object({
        sessionId: sessionIdField,
        productId: z.string(),
        quantity: z.number().int().min(1).max(10).optional(),
      }),
    },
    async ({ sessionId, productId, quantity }) => {
      const { sid, userId } = await withSession(sessionId);
      const result = await runTool("add_to_cart", { productId, quantity }, { userId });
      return textResult({ sessionId: sid, ...result });
    }
  );

  server.registerTool(
    "view_cart",
    {
      description: "Get the session's current cart: items, subtotal, shipping, and total.",
      inputSchema: z.object({ sessionId: sessionIdField }),
    },
    async ({ sessionId }) => {
      const { sid, userId } = await withSession(sessionId);
      const result = await runTool("view_cart", {}, { userId });
      return textResult({ sessionId: sid, ...result });
    }
  );

  server.registerTool(
    "update_cart_item",
    {
      description: "Change the quantity of an item already in the cart. Rejected if it would exceed stock.",
      inputSchema: z.object({
        sessionId: sessionIdField,
        itemId: z.string().describe("The cart item's ID, not the product ID"),
        quantity: z.number().int().min(1).max(10),
      }),
    },
    async ({ sessionId, itemId, quantity }) => {
      const { sid, userId } = await withSession(sessionId);
      const result = await runTool("update_cart_item", { itemId, quantity }, { userId });
      return textResult({ sessionId: sid, ...result });
    }
  );

  server.registerTool(
    "remove_cart_item",
    {
      description: "Remove an item from the cart entirely.",
      inputSchema: z.object({
        sessionId: sessionIdField,
        itemId: z.string().describe("The cart item's ID, not the product ID"),
      }),
    },
    async ({ sessionId, itemId }) => {
      const { sid, userId } = await withSession(sessionId);
      const result = await runTool("remove_cart_item", { itemId }, { userId });
      return textResult({ sessionId: sid, ...result });
    }
  );

  server.registerTool(
    "list_addresses",
    {
      description: "List the session's saved shipping addresses, for choosing one at checkout.",
      inputSchema: z.object({ sessionId: sessionIdField }),
    },
    async ({ sessionId }) => {
      const { sid, userId } = await withSession(sessionId);
      const result = await runTool("list_addresses", {}, { userId });
      return textResult({ sessionId: sid, ...result });
    }
  );

  server.registerTool(
    "request_new_address",
    {
      description: "Save a new shipping address for this session, to use at checkout.",
      inputSchema: z.object({
        sessionId: sessionIdField,
        name: z.string().min(1),
        phone: z.string().min(6),
        street: z.string().min(1),
        city: z.string().min(1),
        state: z.string().min(1),
        postalCode: z.string().min(3),
      }),
    },
    async ({ sessionId, name, phone, street, city, state, postalCode }) => {
      const { sid, userId } = await withSession(sessionId);
      const address = await prisma.address.create({
        data: { userId, name, phone, line1: street, city, state, zip: postalCode },
      });
      return textResult({ sessionId: sid, address });
    }
  );

  server.registerTool(
    "preview_order",
    {
      description:
        "Compute the final order total for the session's cart and a saved address, and get a confirmToken. Creates nothing yet — call create_order with the confirmToken to actually place the order.",
      inputSchema: z.object({
        sessionId: sessionIdField,
        addressId: z.string().describe("One of the session's saved address IDs, from list_addresses or request_new_address"),
      }),
    },
    async ({ sessionId, addressId }) => {
      const { sid, userId } = await withSession(sessionId);
      const result = await buildOrderPreview(userId, addressId);
      return textResult({ sessionId: sid, ...result });
    }
  );

  server.registerTool(
    "create_order",
    {
      description:
        "Place the order using the confirmToken from preview_order. Creates a real pending-payment order, clears the cart, and returns a payment link.",
      inputSchema: z.object({
        sessionId: sessionIdField,
        confirmToken: z.string().describe("The confirmToken returned by preview_order"),
      }),
    },
    async ({ sessionId, confirmToken }) => {
      const { sid, userId } = await withSession(sessionId);
      const result = await confirmOrder(userId, confirmToken);
      return textResult({ sessionId: sid, ...result });
    }
  );

  return server;
});

// Some clients (e.g. Sarvam Indus/Samvaad) send every JSON-RPC field as a string, so `params`
// arrives as a JSON-encoded string instead of an object. The MCP SDK's transport hard-rejects
// that shape before it ever reaches our tools (-32600), so it has to be unwrapped here, in front
// of handler.fetch() — the only place upstream of the SDK's own request parsing.
async function normalizeStringifiedParams(request: NextRequest): Promise<Request> {
  const text = await request.text();
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return new Request(request.url, { method: request.method, headers: request.headers, body: text });
  }
  if (body && typeof body === "object" && typeof (body as { params?: unknown }).params === "string") {
    try {
      (body as { params: unknown }).params = JSON.parse((body as { params: string }).params);
    } catch {
      // Leave it as-is — let the SDK reject it with its own error.
    }
  }
  const headers = new Headers(request.headers);
  headers.delete("content-length");
  return new Request(request.url, { method: request.method, headers, body: JSON.stringify(body) });
}

// Public on purpose: Claude.ai's "Add custom connector" UI only takes a URL, no header field, so
// anyone sharing this link needs it to work with no key. Every tool call is scoped to a throwaway
// guest User (lib/services/guestSession.ts) and rate-limited (lib/agent/rateLimit.ts), and
// Razorpay stays in test mode — never wire this same pattern to a real-account-bearing endpoint.
export async function POST(request: NextRequest) {
  return handler.fetch(await normalizeStringifiedParams(request));
}

export async function GET(request: NextRequest) {
  return handler.fetch(request);
}
