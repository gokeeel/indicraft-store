/**
 * Phase 3 language eval (PRD Section 13): 30 scripted single-turn user
 * messages — 10 English, 10 Tamil, 10 Tanglish — checked against the real
 * Sarvam model for correct first tool-call selection. Target: >=85% per
 * language before moving on; otherwise apply the mitigations in PRD 5.5.
 *
 * Run: npx tsx scripts/agent-eval.ts
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { SarvamHttpLLM, type Msg } from "../lib/agent/sarvam";
import { TOOL_SCHEMAS } from "../lib/agent/tools";
import { SYSTEM_PROMPT } from "../lib/agent/prompts";

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

type Lang = "en" | "ta" | "tanglish";
type Case = { lang: Lang; text: string; expected: string };

const cases: Case[] = [
  // English
  { lang: "en", text: "show me sarees", expected: "search_products" },
  { lang: "en", text: "I'm looking for spices under 500 rupees", expected: "search_products" },
  { lang: "en", text: "browse home decor", expected: "search_products" },
  { lang: "en", text: "do you have any jute bags", expected: "search_products" },
  { lang: "en", text: "show me copper items", expected: "search_products" },
  { lang: "en", text: "find me something in mugs", expected: "search_products" },
  { lang: "en", text: "I want to buy a gift for someone", expected: "ask_user" },
  { lang: "en", text: "suggest something nice for my home", expected: "ask_user" },
  { lang: "en", text: "what's in my cart", expected: "view_cart" },
  { lang: "en", text: "show my cart", expected: "view_cart" },

  // Tamil
  { lang: "ta", text: "எனக்கு சேலை காட்டுங்க", expected: "search_products" },
  { lang: "ta", text: "500 ரூபாய்க்குள் மசாலா பொருட்கள் வேணும்", expected: "search_products" },
  { lang: "ta", text: "வீட்டு அலங்கார பொருட்கள் காட்டுங்க", expected: "search_products" },
  { lang: "ta", text: "சணல் பை இருக்கா", expected: "search_products" },
  { lang: "ta", text: "செம்பு பொருட்கள் காட்டுங்க", expected: "search_products" },
  { lang: "ta", text: "மக் வகைகள் காட்டுங்க", expected: "search_products" },
  { lang: "ta", text: "ஒருத்தருக்கு பரிசு வாங்கணும்", expected: "ask_user" },
  { lang: "ta", text: "ஏதாவது நல்லா இருக்குற பொருள் சொல்லுங்க", expected: "ask_user" },
  { lang: "ta", text: "என் கார்ட்ல என்ன இருக்கு", expected: "view_cart" },
  { lang: "ta", text: "என் கார்ட் காட்டுங்க", expected: "view_cart" },

  // Tanglish
  { lang: "tanglish", text: "enakku saree kaatunga", expected: "search_products" },
  { lang: "tanglish", text: "500 rupaikulla spices venum", expected: "search_products" },
  { lang: "tanglish", text: "veetu alangara porutkal kaatunga", expected: "search_products" },
  { lang: "tanglish", text: "jute bag irukka", expected: "search_products" },
  { lang: "tanglish", text: "copper porutkal kaatunga", expected: "search_products" },
  { lang: "tanglish", text: "mug varieties kaatunga", expected: "search_products" },
  { lang: "tanglish", text: "oruthanukku gift vanganum", expected: "ask_user" },
  { lang: "tanglish", text: "edhavadhu nalla irukura porul sollunga", expected: "ask_user" },
  { lang: "tanglish", text: "en cart-la enna irukku", expected: "view_cart" },
  { lang: "tanglish", text: "en cart kaatunga", expected: "view_cart" },
];

async function main() {
  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) {
    console.error("SARVAM_API_KEY not set — the language eval needs the real API.");
    process.exit(1);
  }
  const llm = new SarvamHttpLLM(apiKey);

  const results: { lang: Lang; text: string; expected: string; actual: string; pass: boolean }[] = [];

  for (const c of cases) {
    const messages: Msg[] = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: c.text },
    ];
    let actual = "(none)";
    try {
      const res = await llm.chat({ messages, tools: TOOL_SCHEMAS });
      actual = res.toolCalls?.[0]?.name ?? "(no tool call)";
    } catch (err) {
      actual = `(error: ${err instanceof Error ? err.message : String(err)})`;
    }
    const pass = actual === c.expected;
    results.push({ ...c, actual, pass });
    console.log(`${pass ? "PASS" : "FAIL"} [${c.lang}] "${c.text}" -> expected ${c.expected}, got ${actual}`);
  }

  const byLang: Record<string, { pass: number; total: number }> = {};
  for (const r of results) {
    byLang[r.lang] ??= { pass: 0, total: 0 };
    byLang[r.lang].total++;
    if (r.pass) byLang[r.lang].pass++;
  }

  console.log("\n--- Summary ---");
  for (const [lang, { pass, total }] of Object.entries(byLang)) {
    console.log(`${lang}: ${pass}/${total} (${Math.round((pass / total) * 100)}%)`);
  }
  const totalPass = results.filter((r) => r.pass).length;
  console.log(`Overall: ${totalPass}/${results.length} (${Math.round((totalPass / results.length) * 100)}%)`);
}

main();
