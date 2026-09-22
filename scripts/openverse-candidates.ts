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
const CANDIDATES_PER_PRODUCT = 3;
const OUT_DIR = join(__dirname, "..", "scratch", "openverse-batch3");
const UA = "Indicraft-Catalog-Pipeline/1.0 (contact: viberzzz2026@gmail.com)";

type PilotProduct = { id: string; name: string; category: string; region: string; query: string };

// Batch 3: well-documented, widely-known craft names (more likely to have Commons/Flickr
// coverage than batch 2's more obscure regional terms). Avoids overlap with the 74 products
// already in the catalog.
const PRODUCTS: PilotProduct[] = [
  // Famous sarees not yet covered
  { id: "patola-saree", name: "Patan Patola Double-Ikat Saree", category: "fabric", region: "Patan, Gujarat", query: "patola saree patan gujarat" },
  { id: "kasavu-saree", name: "Kerala Kasavu Saree", category: "fabric", region: "Kerala", query: "kasavu saree kerala gold border" },
  { id: "ilkal-saree", name: "Ilkal Saree", category: "fabric", region: "Ilkal, Karnataka", query: "ilkal saree karnataka" },
  { id: "baluchari-saree", name: "Baluchari Silk Saree", category: "fabric", region: "West Bengal", query: "baluchari saree bengal silk" },
  { id: "maheshwari-saree", name: "Maheshwari Saree", category: "fabric", region: "Maheshwar, Madhya Pradesh", query: "maheshwari saree madhya pradesh" },
  { id: "gadwal-saree", name: "Gadwal Silk Saree", category: "fabric", region: "Gadwal, Telangana", query: "gadwal saree telangana silk" },
  { id: "tant-saree", name: "Bengal Tant Cotton Saree", category: "fabric", region: "West Bengal", query: "tant saree bengal cotton handloom" },
  { id: "himroo-fabric", name: "Himroo Woven Fabric", category: "fabric", region: "Aurangabad, Maharashtra", query: "himroo fabric aurangabad weave" },
  { id: "tangaliya-weave", name: "Tangaliya Woven Shawl", category: "fabric", region: "Surendranagar, Gujarat", query: "tangaliya weave gujarat shawl" },

  // Paintings
  { id: "mysore-painting", name: "Mysore Traditional Painting", category: "paintings", region: "Mysore, Karnataka", query: "mysore painting karnataka traditional gold" },
  { id: "kerala-mural-painting", name: "Kerala Mural Painting", category: "paintings", region: "Kerala", query: "kerala mural painting traditional temple" },
  { id: "kangra-painting", name: "Kangra Miniature Painting", category: "paintings", region: "Kangra, Himachal Pradesh", query: "kangra painting himachal miniature" },
  { id: "nirmal-painting", name: "Nirmal Painting", category: "paintings", region: "Nirmal, Telangana", query: "nirmal painting telangana gold" },
  { id: "patachitra-palm-leaf", name: "Odisha Palm Leaf Etching", category: "paintings", region: "Odisha", query: "palm leaf etching odisha patachitra" },

  // Jewelry
  { id: "thewa-jewelry", name: "Thewa Gold Jewelry", category: "jewelry", region: "Pratapgarh, Rajasthan", query: "thewa jewelry rajasthan gold glass" },
  { id: "polki-jewelry", name: "Polki Uncut Diamond Jewelry", category: "jewelry", region: "Rajasthan", query: "polki jewelry rajasthan uncut diamond" },
  { id: "bengal-filigree-jewelry", name: "Bengal Silver Filigree Jewelry", category: "jewelry", region: "West Bengal", query: "bengal filigree silver jewelry india" },
  { id: "coorg-coin-necklace", name: "Coorg Coin Necklace", category: "jewelry", region: "Coorg, Karnataka", query: "coorg coin necklace kodagu karnataka" },
  { id: "adivasi-bead-jewelry", name: "Adivasi Tribal Bead Jewelry", category: "jewelry", region: "Central India", query: "adivasi tribal bead jewelry india" },

  // Home decor / crafts
  { id: "lippan-mud-mirror-art", name: "Lippan Mud Mirror Wall Art", category: "home-decor", region: "Kutch, Gujarat", query: "lippan art kutch mud mirror" },
  { id: "pipli-applique-work", name: "Pipli Applique Wall Hanging", category: "home-decor", region: "Pipli, Odisha", query: "pipli applique work odisha" },
  { id: "kashmiri-papier-mache-ornament", name: "Kashmiri Papier-Mache Ornament", category: "home-decor", region: "Kashmir", query: "kashmiri papier mache ornament craft" },
  { id: "thanjavur-plate", name: "Thanjavur Art Plate", category: "home-decor", region: "Thanjavur, Tamil Nadu", query: "thanjavur art plate tamil nadu" },
  { id: "bidri-hookah", name: "Bidri Ware Hookah Base", category: "home-decor", region: "Bidar, Karnataka", query: "bidriware hookah bidar karnataka" },
  { id: "channapatna-bangles", name: "Channapatna Lacquer Bangles", category: "jewelry", region: "Channapatna, Karnataka", query: "channapatna lacquer bangles" },
  { id: "sikki-grass-craft", name: "Sikki Grass Craft Basket", category: "household", region: "Bihar", query: "sikki grass craft bihar basket" },
  { id: "nettur-petti-box", name: "Nettur Petti Wooden Box", category: "home-decor", region: "Kerala", query: "nettur petti wooden box kerala" },

  // Woodwork
  { id: "varanasi-wooden-toys", name: "Varanasi Wooden Toys", category: "woodwork-toys", region: "Varanasi, Uttar Pradesh", query: "varanasi wooden toys craft" },
  { id: "rosewood-inlay-mysore", name: "Mysore Rosewood Inlay Box", category: "home-decor", region: "Mysore, Karnataka", query: "mysore rosewood inlay box" },
  { id: "bastar-wood-carving", name: "Bastar Wood Carving", category: "woodwork-toys", region: "Bastar, Chhattisgarh", query: "bastar wood carving chhattisgarh" },

  // Leather / misc
  { id: "rajasthani-leather-jutti", name: "Rajasthani Leather Jutti", category: "uncategorized", region: "Jodhpur, Rajasthan", query: "rajasthani jutti leather jodhpur" },
  { id: "kutch-leather-craft", name: "Kutch Leather Craft Bag", category: "uncategorized", region: "Kutch, Gujarat", query: "kutch leather craft bag gujarat" },

  // More fabric/textile variety
  { id: "khadi-silk-stole", name: "Khadi Silk Stole", category: "fabric", region: "India", query: "khadi silk stole handspun" },
  { id: "batik-print-fabric", name: "Batik Print Fabric", category: "fabric", region: "West Bengal/Gujarat", query: "batik print fabric india wax" },
  { id: "chamba-rumal", name: "Chamba Rumal Embroidery", category: "fabric", region: "Chamba, Himachal Pradesh", query: "chamba rumal embroidery himachal" },
  { id: "kasuti-embroidery", name: "Kasuti Embroidered Fabric", category: "fabric", region: "Karnataka", query: "kasuti embroidery karnataka" },
  { id: "manipuri-shawl", name: "Manipuri Handloom Shawl", category: "fabric", region: "Manipur", query: "manipuri handloom shawl weave" },

  // Pottery / metal
  { id: "jaipur-blue-pottery-tile", name: "Jaipur Blue Pottery Tile", category: "home-decor", region: "Jaipur, Rajasthan", query: "jaipur blue pottery tile" },
  { id: "kashmiri-copper-samovar", name: "Kashmiri Copper Samovar", category: "household", region: "Kashmir", query: "kashmiri copper samovar craft" },
  { id: "kerala-brass-uruli", name: "Kerala Brass Uruli", category: "household", region: "Kerala", query: "kerala brass uruli vessel" },
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
