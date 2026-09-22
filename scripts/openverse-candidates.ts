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
const OUT_DIR = join(__dirname, "..", "scratch", "openverse-wide");
const UA = "Indicraft-Catalog-Pipeline/1.0 (contact: viberzzz2026@gmail.com)";

type PilotProduct = { id: string; name: string; category: string; region: string; query: string };

// Broad taxonomy sweep, weighted toward categories the pilot proved productive (textiles,
// jewelry, pottery/metalwork) but covering breadth for search-relevance regardless of photo
// hit rate. Avoids exact overlap with the existing 62-product catalog.
const PRODUCTS: PilotProduct[] = [
  // Textiles & weaves
  { id: "pochampally-ikat-saree", name: "Pochampally Ikat Saree", category: "fabric", region: "Telangana", query: "pochampally ikat saree" },
  { id: "sambalpuri-saree", name: "Sambalpuri Ikat Saree", category: "fabric", region: "Odisha", query: "sambalpuri saree odisha" },
  { id: "paithani-saree", name: "Paithani Silk Saree", category: "fabric", region: "Paithan, Maharashtra", query: "paithani saree maharashtra" },
  { id: "tussar-silk-fabric", name: "Tussar Silk Fabric", category: "fabric", region: "Bhagalpur, Bihar", query: "tussar silk fabric india" },
  { id: "phulkari-dupatta-2", name: "Punjab Phulkari Dupatta", category: "fabric", region: "Punjab", query: "phulkari embroidery dupatta" },
  { id: "shibori-dyed-fabric", name: "Bandhani Tie-Dye Fabric", category: "fabric", region: "Rajasthan", query: "bandhani tie dye fabric rajasthan" },
  { id: "khadi-cotton-fabric", name: "Handspun Khadi Cotton", category: "fabric", region: "India", query: "khadi handspun cotton india" },
  { id: "kanjeevaram-silk", name: "Kanjeevaram Silk Border", category: "fabric", region: "Tamil Nadu", query: "kanjeevaram silk saree border" },
  { id: "banarasi-brocade", name: "Banarasi Brocade Fabric", category: "fabric", region: "Varanasi, Uttar Pradesh", query: "banarasi brocade weaving" },
  { id: "kalamkari-hand-painted", name: "Hand-Painted Kalamkari Cloth", category: "fabric", region: "Andhra Pradesh", query: "kalamkari hand painted cloth" },
  { id: "kani-shawl", name: "Kani Weave Shawl", category: "fabric", region: "Kashmir", query: "kani shawl kashmir weave" },
  { id: "leheriya-fabric", name: "Leheriya Tie-Dye Fabric", category: "fabric", region: "Jaipur, Rajasthan", query: "leheriya tie dye rajasthan" },
  { id: "mekhela-chador", name: "Assamese Mekhela Chador", category: "fabric", region: "Assam", query: "mekhela chador assam silk" },
  { id: "muga-silk-fabric", name: "Assam Muga Silk Fabric", category: "fabric", region: "Assam", query: "muga silk assam" },
  { id: "chanderi-dupatta", name: "Chanderi Silk Dupatta", category: "fabric", region: "Chanderi, Madhya Pradesh", query: "chanderi silk dupatta" },

  // Pottery & terracotta
  { id: "khurja-pottery", name: "Khurja Ceramic Pottery", category: "pottery", region: "Khurja, Uttar Pradesh", query: "khurja pottery ceramic india" },
  { id: "black-pottery-nizamabad", name: "Nizamabad Black Pottery", category: "pottery", region: "Nizamabad, Uttar Pradesh", query: "nizamabad black pottery" },
  { id: "molela-terracotta-plaque", name: "Molela Terracotta Plaque", category: "pottery", region: "Molela, Rajasthan", query: "molela terracotta plaque rajasthan" },
  { id: "goalpara-black-pottery", name: "Goalpara Pottery", category: "pottery", region: "Goalpara, Assam", query: "goalpara pottery assam" },
  { id: "kutch-pottery", name: "Kutch Painted Pottery", category: "pottery", region: "Kutch, Gujarat", query: "kutch pottery painted gujarat" },

  // Metalwork
  { id: "bastar-dhokra-jewelry", name: "Bastar Dhokra Jewelry", category: "jewelry", region: "Bastar, Chhattisgarh", query: "bastar dhokra jewelry" },
  { id: "moradabad-brassware", name: "Moradabad Brassware", category: "home-decor", region: "Moradabad, Uttar Pradesh", query: "moradabad brass handicraft" },
  { id: "thatheras-copper", name: "Thatheras Hammered Copperware", category: "household", region: "Jandiala Guru, Punjab", query: "thatheras copper craft punjab" },
  { id: "bell-metal-craft-kerala", name: "Kerala Bell Metal Lamp", category: "home-decor", region: "Kerala", query: "bell metal lamp kerala nilavilakku" },

  // Jewelry
  { id: "kundan-jewelry", name: "Kundan Jewelry Set", category: "jewelry", region: "Rajasthan", query: "kundan jewelry rajasthan traditional" },
  { id: "temple-jewelry", name: "South Indian Temple Jewelry", category: "jewelry", region: "Tamil Nadu", query: "temple jewelry south india traditional" },
  { id: "lac-bangles", name: "Lac Bangles", category: "jewelry", region: "Rajasthan", query: "lac bangles rajasthan craft" },
  { id: "oxidised-silver-jewelry", name: "Oxidised Silver Tribal Jewelry", category: "jewelry", region: "Rajasthan", query: "oxidised silver tribal jewelry india" },
  { id: "terracotta-jewelry", name: "Terracotta Jewelry Set", category: "jewelry", region: "West Bengal", query: "terracotta jewelry handmade india" },
  { id: "beaded-tribal-necklace", name: "Naga Tribal Beaded Necklace", category: "jewelry", region: "Nagaland", query: "naga tribal beaded necklace" },

  // Paintings
  { id: "warli-canvas-art", name: "Warli Tribal Art Canvas", category: "paintings", region: "Maharashtra", query: "warli painting canvas tribal art" },
  { id: "phad-painting", name: "Phad Scroll Painting", category: "paintings", region: "Rajasthan", query: "phad painting rajasthan scroll" },
  { id: "miniature-painting-rajasthan", name: "Rajasthani Miniature Painting", category: "paintings", region: "Udaipur, Rajasthan", query: "rajasthani miniature painting" },
  { id: "kalighat-painting", name: "Kalighat Painting", category: "paintings", region: "Kolkata, West Bengal", query: "kalighat painting bengal" },
  { id: "cheriyal-scroll-painting", name: "Cheriyal Scroll Painting", category: "paintings", region: "Telangana", query: "cheriyal scroll painting telangana" },

  // Woodwork & toys
  { id: "saharanpur-wood-carving", name: "Saharanpur Wood Carving", category: "woodwork-toys", region: "Saharanpur, Uttar Pradesh", query: "saharanpur wood carving craft" },
  { id: "sandalwood-carving", name: "Mysore Sandalwood Carving", category: "woodwork-toys", region: "Mysore, Karnataka", query: "mysore sandalwood carving" },
  { id: "etikoppaka-wooden-toys", name: "Etikoppaka Lacquer Toys", category: "woodwork-toys", region: "Etikoppaka, Andhra Pradesh", query: "etikoppaka wooden toys lacquer" },
  { id: "wooden-elephant-carving", name: "Carved Wooden Elephant", category: "home-decor", region: "Kerala", query: "carved wooden elephant kerala craft" },

  // Home decor / misc craft
  { id: "rajasthani-puppet-decor", name: "Rajasthani Puppet Wall Decor", category: "home-decor", region: "Rajasthan", query: "rajasthani puppet decor kathputli" },
  { id: "channapatna-toy-set-2", name: "Channapatna Lacquerware Set", category: "home-decor", region: "Karnataka", query: "channapatna lacquerware toys" },
  { id: "aranmula-mirror", name: "Aranmula Kannadi Metal Mirror", category: "home-decor", region: "Aranmula, Kerala", query: "aranmula mirror kerala metal" },
  { id: "kondapalli-toys-2", name: "Kondapalli Bommalu Toys", category: "woodwork-toys", region: "Andhra Pradesh", query: "kondapalli bommalu toys" },
  { id: "meenakari-plate", name: "Meenakari Enamel Plate", category: "home-decor", region: "Rajasthan", query: "meenakari enamel plate rajasthan" },
  { id: "pashmina-embroidered-stole", name: "Kashmiri Embroidered Stole", category: "fabric", region: "Kashmir", query: "kashmiri embroidered stole pashmina" },
  { id: "cane-basket-northeast", name: "Northeast India Cane Basket", category: "household", region: "Manipur/Nagaland", query: "cane basket weaving northeast india" },
  { id: "coir-craft-kerala", name: "Kerala Coir Craft Mat", category: "household", region: "Kerala", query: "coir craft kerala handicraft" },
  { id: "brass-diya-set-2", name: "Traditional Brass Diya Set", category: "home-decor", region: "India", query: "brass diya oil lamp traditional india" },
  { id: "clay-idol-craft", name: "Kumartuli Clay Idol Craft", category: "home-decor", region: "Kolkata, West Bengal", query: "kumartuli clay idol craft kolkata" },
  { id: "seashell-craft", name: "Seashell Craft Decor", category: "home-decor", region: "Odisha coast", query: "seashell craft decor india" },
  { id: "horn-craft-kerala", name: "Buffalo Horn Craft", category: "home-decor", region: "Kerala", query: "buffalo horn craft kerala handicraft" },
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
