import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";

/**
 * MCP tool calls come from Claude/ChatGPT with no logged-in user. Every cart/order/address
 * service in this app is keyed by a real User row, so an MCP "session" is just a throwaway
 * guest User — same tables, same transactions, no schema changes, no second session store.
 */
export async function getOrCreateGuestUser(sessionId: string): Promise<string> {
  const email = `mcp-guest-${sessionId}@mcp.indicraft.local`;
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) return existing.id;

  const user = await prisma.user.create({
    data: {
      name: "MCP Guest",
      email,
      password: crypto.randomBytes(32).toString("hex"), // never used to log in
      role: "customer",
    },
    select: { id: true },
  });
  return user.id;
}
