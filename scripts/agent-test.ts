/**
 * Phase 1 acceptance check: "show me sarees under 3000" should produce a
 * search_products tool call and return real DB products — with the mock LLM
 * always, and with the real Sarvam client if SARVAM_API_KEY is set.
 *
 * Run: npx tsx scripts/agent-test.ts
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import { MockLLM, SarvamHttpLLM } from "../lib/agent/sarvam";
import { runAgentLoop } from "../lib/agent/loop";

// tsx doesn't auto-load .env.local the way `next dev` does — load it manually.
function loadEnvLocal() {
  try {
    const raw = readFileSync(join(__dirname, "..", ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].trim().replace(/^"|"$/g, "");
      }
    }
  } catch {
    // no .env.local — fine, real-API check will just be skipped
  }
}
loadEnvLocal();

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({ where: { email: "customer@indicraft.test" } });
  if (!user) throw new Error("Seed user customer@indicraft.test not found — run `npm run db:seed` first.");

  const prompt = "show me sarees under 3000";
  const history = [{ role: "user" as const, content: prompt }];

  console.log(`\n=== MockLLM: "${prompt}" ===`);
  const mockResult = await runAgentLoop(new MockLLM(), history, { userId: user.id });
  report(mockResult);

  const apiKey = process.env.SARVAM_API_KEY;
  if (apiKey) {
    console.log(`\n=== SarvamHttpLLM: "${prompt}" ===`);
    const realResult = await runAgentLoop(new SarvamHttpLLM(apiKey), history, { userId: user.id });
    report(realResult);
  } else {
    console.log("\n(SARVAM_API_KEY not set — skipping real-API check)");
  }
}

function report(result: { assistantText: string; blocks: unknown[] }) {
  console.log("assistantText:", result.assistantText);
  console.log("blocks:", result.blocks.length);
  for (const block of result.blocks) {
    const b = block as { type: string; products?: { name: string; price: unknown }[] };
    if (b.type === "product_carousel") {
      console.log(
        "  product_carousel ->",
        b.products?.map((p) => `${p.name} (₹${p.price})`).join(", ")
      );
    } else {
      console.log("  block:", b.type);
    }
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
