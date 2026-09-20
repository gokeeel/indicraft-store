/**
 * Regression check for a real bug caught live: after list_addresses returns, the model
 * fabricated a total and told the user to "tap Confirm" before preview_order had ever
 * been called. Replays the exact tool-result history and checks the reply doesn't state
 * a currency amount or claim readiness to confirm.
 * Run: npx tsx scripts/address-hallucination-check.ts
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

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
    // no .env.local
  }
}
loadEnvLocal();

import { SarvamHttpLLM, type Msg } from "../lib/agent/sarvam";
import { TOOL_SCHEMAS } from "../lib/agent/tools";
import { SYSTEM_PROMPT } from "../lib/agent/prompts";

async function main() {
  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) {
    console.error("SARVAM_API_KEY not set");
    process.exit(1);
  }
  const llm = new SarvamHttpLLM(apiKey);

  const addressToolResult = JSON.stringify({
    tool: "list_addresses",
    addresses: [
      {
        id: "addr-1",
        name: "Karthik Raja",
        phone: "9876543210",
        line1: "Block 5, House No. 42",
        city: "Tiruppur",
        state: "Tamil Nadu",
        zip: "641601",
        isDefault: false,
      },
    ],
  });

  const messages: Msg[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: "let's checkout" },
    {
      role: "assistant",
      content: "",
      tool_calls: [{ id: "call-1", type: "function", function: { name: "list_addresses", arguments: "{}" } }],
    },
    { role: "tool", tool_call_id: "call-1", name: "list_addresses", content: addressToolResult },
  ];

  const res = await llm.chat({ messages, tools: TOOL_SCHEMAS });
  const text = res.text ?? "";

  console.log("Model reply:", JSON.stringify(text));
  console.log("Tool calls:", res.toolCalls?.map((c: { name: string }) => c.name) ?? "(none)");

  const calledPreviewOrder = res.toolCalls?.some((c: { name: string }) => c.name === "preview_order") ?? false;
  const mentionsRupees = /₹\s?\d/.test(text);
  const claimsReadyToConfirm = /ready to confirm|tap confirm|confirm.*order/i.test(text);

  let failures = 0;
  function check(label: string, condition: boolean) {
    console.log(`${condition ? "PASS" : "FAIL"} ${label}`);
    if (!condition) failures++;
  }

  // Either it's fine to call preview_order right away (if it somehow has a definite single
  // address and decides to proceed) OR it must not fabricate totals/confirm-readiness in text
  // without having done so.
  if (calledPreviewOrder) {
    check("called preview_order itself before mentioning a total (acceptable)", true);
  } else {
    check("does not mention a rupee amount without calling preview_order", !mentionsRupees);
    check("does not claim ready-to-confirm without calling preview_order", !claimsReadyToConfirm);
  }

  process.exit(failures === 0 ? 0 : 1);
}

main();
