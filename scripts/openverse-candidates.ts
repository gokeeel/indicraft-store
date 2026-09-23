/**
 * Catalog-expansion image pipeline: query Openverse for commercially-usable (CC0/PDM/BY/BY-SA
 * -- explicitly excludes NC and ND variants, which forbid the exact use this site needs)
 * candidate photos per product, download full-size images locally for visual review, and write
 * a manifest Claude picks from.
 *
 * Run: npx tsx scripts/openverse-candidates.ts
 */
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const OPENVERSE_URL = "https://api.openverse.org/v1/images/";
const CANDIDATES_PER_PRODUCT = 4;
const OUT_DIR = join(__dirname, "..", "scratch", "openverse-batch5");
const UA = "Indicraft-Catalog-Pipeline/1.0 (contact: viberzzz2026@gmail.com)";

type PilotProduct = { id: string; name: string; category: string; region: string; query: string };

// Batch 5: existing products currently showing picsum.photos placeholders, flagged by the user.
// Ids are the products' REAL slugs (not shorthand) since these replace images on already-seeded
// products rather than creating new ones. Loose/generic matches are acceptable per user
// instruction (e.g. any leather sandal photo for Kolhapuri chappals) -- queries are broadened
// accordingly rather than chasing exact regional specificity.
const PRODUCTS: PilotProduct[] = [
  { id: "naga-handwoven-shawl", name: "Naga Handwoven Shawl", category: "fabric", region: "Nagaland", query: "naga tribal handwoven shawl" },
  { id: "kolhapuri-leather-chappals", name: "Kolhapuri Leather Chappals", category: "misc", region: "Kolhapur, Maharashtra", query: "kolhapuri chappal leather sandal" },
  { id: "rajasthani-garam-masala-blend-150g", name: "Rajasthani Garam Masala Blend", category: "spices", region: "Rajasthan", query: "garam masala spice blend powder" },
  { id: "assam-tea-garden-cinnamon-100g", name: "Assam Tea Garden Cinnamon", category: "spices", region: "Assam", query: "cinnamon sticks spice" },
  { id: "wayanad-wild-turmeric-200g", name: "Wayanad Wild Turmeric", category: "spices", region: "Wayanad, Kerala", query: "turmeric powder root" },
  { id: "kashmiri-red-chilli-powder-200g", name: "Kashmiri Red Chilli Powder", category: "spices", region: "Kashmir", query: "kashmiri red chilli powder" },
  { id: "kerala-green-cardamom-100g", name: "Kerala Green Cardamom", category: "spices", region: "Kerala", query: "green cardamom pods" },
  { id: "malabar-black-pepper-250g", name: "Malabar Black Pepper", category: "spices", region: "Kerala", query: "black pepper corns spice" },
  { id: "kashmiri-saffron-5g", name: "Kashmiri Saffron", category: "spices", region: "Pampore, Kashmir", query: "saffron threads kashmir" },
  { id: "copper-moscow-mule-mug", name: "Copper Moscow Mule Mug", category: "mugs", region: "Rajasthan", query: "copper moscow mule mug" },
  { id: "warli-art-ceramic-mug", name: "Warli Art Ceramic Mug", category: "mugs", region: "Maharashtra", query: "warli art painted mug" },
  { id: "madhubani-hand-painted-mug", name: "Madhubani Hand-Painted Mug", category: "mugs", region: "Bihar", query: "madhubani painted mug ceramic" },
  { id: "terracotta-kulhad-mug-set-of-4", name: "Terracotta Kulhad Mug Set of 4", category: "mugs", region: "Uttar Pradesh", query: "kulhad terracotta clay cup" },
  { id: "blue-pottery-ceramic-mug", name: "Blue Pottery Ceramic Mug", category: "mugs", region: "Jaipur, Rajasthan", query: "jaipur blue pottery mug cup" },
  { id: "copper-water-bottle-hammered", name: "Copper Water Bottle - Hammered", category: "household", region: "Rajasthan", query: "hammered copper water bottle" },
  { id: "moonj-grass-fruit-basket", name: "Moonj Grass Fruit Basket", category: "household", region: "Uttar Pradesh", query: "moonj grass woven basket" },
  { id: "handloom-cotton-table-runner", name: "Handloom Cotton Table Runner", category: "household", region: "Tamil Nadu", query: "handloom cotton table runner" },
  { id: "sabai-grass-multipurpose-basket", name: "Sabai Grass Multipurpose Basket", category: "household", region: "Odisha", query: "sabai grass basket woven" },
  { id: "bamboo-storage-basket-set", name: "Bamboo Storage Basket Set", category: "household", region: "Assam", query: "bamboo woven storage basket" },
  { id: "coir-doormat-handwoven", name: "Coir Doormat - Handwoven", category: "household", region: "Kerala", query: "coir doormat handwoven" },
  { id: "terracotta-wall-mask", name: "Terracotta Wall Mask", category: "home-decor", region: "West Bengal", query: "terracotta wall mask clay" },
  { id: "rogan-art-wall-panel", name: "Rogan Art Wall Panel", category: "paintings", region: "Kutch, Gujarat", query: "rogan art painting gujarat" },
  { id: "pattachitra-hand-painted-plate", name: "Pattachitra Hand-Painted Plate", category: "home-decor", region: "Odisha", query: "pattachitra painted plate odisha" },
  { id: "madhubani-painting-peacock", name: "Madhubani Painting - Peacock", category: "paintings", region: "Bihar", query: "madhubani painting peacock" },
  { id: "phulkari-embroidered-dupatta", name: "Phulkari Embroidered Dupatta", category: "fabric", region: "Punjab", query: "phulkari embroidery dupatta punjab" },
  { id: "bandhani-tie-dye-dupatta", name: "Bandhani Tie-Dye Dupatta", category: "fabric", region: "Kutch, Gujarat", query: "bandhani tie dye dupatta" },
];

async function fetchCandidates(query: string) {
  const params = new URLSearchParams({
    q: query,
    license: "cc0,pdm,by,by-sa",
    page_size: String(CANDIDATES_PER_PRODUCT),
    mature: "false",
  });
  const res = await fetch(`${OPENVERSE_URL}?${params}`, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`Openverse error ${res.status}`);
  const data = await res.json();
  return (data.results ?? []) as {
    title: string;
    creator: string;
    license: string;
    url: string;
    foreign_landing_url: string;
    width: number;
    height: number;
  }[];
}

async function main() {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  const manifest: Record<string, unknown> = {};
  let hits = 0;

  for (const product of PRODUCTS) {
    let results: Awaited<ReturnType<typeof fetchCandidates>> = [];
    try {
      results = await fetchCandidates(product.query);
    } catch (err) {
      console.error(`${product.id}: FAILED ${err instanceof Error ? err.message : err}`);
      await new Promise((r) => setTimeout(r, 600));
      continue;
    }

    if (results.length > 0) {
      hits++;
      console.log(`${product.id}: ${results.length} candidates`);
      for (const r of results) console.log(`   ${r.title} — ${r.creator} — ${r.license} — ${r.width}x${r.height} — ${r.url}`);
    } else {
      console.log(`${product.id}: 0`);
    }

    manifest[product.id] = {
      ...product,
      candidates: results.map((r) => ({
        title: r.title,
        creator: r.creator,
        license: r.license,
        fullUrl: r.url,
        landingUrl: r.foreign_landing_url,
        width: r.width,
        height: r.height,
      })),
    };
    await new Promise((r) => setTimeout(r, 600));
  }

  writeFileSync(join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`\n${hits}/${PRODUCTS.length} queries returned at least one candidate. Manifest in ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
