import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const categories = [
  { name: "Fabric", slug: "fabric" },
  { name: "Home Decor", slug: "home-decor" },
  { name: "Household", slug: "household" },
  { name: "Mugs", slug: "mugs" },
  { name: "Spices", slug: "spices" },
  { name: "Uncategorized", slug: "uncategorized" },
];

// Real product photos (from the client's brand asset repo) keyed by product slug.
// Products without an entry here fall back to a picsum placeholder.
const REAL_PRODUCT_IMAGES: Record<string, string> = {
  "banarasi-silk-saree-zari-border": "banarasi-silk-saree-zari-border.webp",
  "ikat-cotton-dupatta": "ikat-cotton-dupatta.webp",
  "chanderi-handwoven-fabric-2m": "chanderi-handwoven-fabric-2m.webp",
  "kalamkari-block-print-fabric": "kalamkari-block-print-fabric.jpg",
  "jamdani-cotton-saree": "jamdani-cotton-saree.jpg",
  "ajrakh-block-print-stole": "ajrakh-block-print-stole.jpg",
  "dhokra-brass-tribal-figurine": "dhokra-brass-tribal-figurine.jpg",
  "blue-pottery-decorative-vase": "blue-pottery-decorative-vase.jpg",
  "warli-art-wall-hanging": "warli-art-wall-hanging.webp",
  "channapatna-wooden-toy-set": "channapatna-wooden-toy-set.webp",
  "brass-kansa-thali-set": "brass-kansa-thali-set.webp",
  "handcrafted-marble-coasters-set-of-6": "handcrafted-marble-coasters-set-of-6.jpg",
  "handmade-jute-tote-bag": "handmade-jute-tote-bag.webp",
  "meenakari-enamel-jewellery-box": "meenakari-enamel-jewellery-box.jpg",
  "kanchipuram-silk-saree-temple-border": "kanchipuram-silk-saree-temple-border.webp",
  "block-printed-silk-scarf": "block-printed-silk-scarf.jpg",
  "brass-diya-with-stand": "brass-diya-with-stand.webp",
  "brass-incense-holder": "brass-incense-holder.jpg",
  "decorative-terracotta-vase": "decorative-terracotta-vase.jpg",
  "terracotta-water-pot": "terracotta-water-pot.webp",
  "traditional-terracotta-diyas-set": "traditional-terracotta-diyas-set.webp",
  "clay-cooking-pot-set": "clay-cooking-pot-set.webp",
  "clay-water-bottle": "clay-water-bottle.jpg",
  "earthenware-dinner-set": "earthenware-dinner-set.webp",
  "palm-leaf-wall-hanging": "palm-leaf-wall-hanging.webp",
  "palm-leaf-table-mats": "palm-leaf-table-mats.webp",
  "hand-painted-coasters-set": "hand-painted-coasters-set.jpg",
  "tribal-silver-jewelry-set": "tribal-silver-jewelry-set.jpg",
  "bamboo-table-lamp": "bamboo-table-lamp.webp",
  "leather-bound-diary": "leather-bound-diary.webp",
  "handmade-paper-journal": "handmade-paper-journal.jpg",
  "recycled-paper-notebook-set": "recycled-paper-notebook-set.webp",
  "jute-shopping-bag": "jute-shopping-bag.jpg",
  "jute-lunch-bag": "jute-lunch-bag.webp",
  "traditional-wooden-puzzle": "traditional-wooden-puzzle.jpg",
  "wooden-rocking-horse": "wooden-rocking-horse.webp",
};

type SeedProduct = {
  name: string;
  category: string;
  price: number;
  salePrice?: number;
  material: string;
  region: string;
  occasion?: string;
  stock: number;
  description: string;
};

const products: SeedProduct[] = [
  { name: "Banarasi Silk Saree - Zari Border", category: "fabric", price: 6800, salePrice: 5800, material: "Silk", region: "Varanasi, UP", occasion: "Wedding", stock: 8,
    description: "Woven on traditional pit looms by Varanasi's Banarasi weaving families, this saree pairs a rich silk body with a dense zari (gold-thread) border and pallu. Each piece takes a skilled weaver 10-15 days to complete, making the brocade work slightly unique from saree to saree." },
  { name: "Ikat Cotton Dupatta", category: "fabric", price: 1200, material: "Cotton", region: "Pochampally, Telangana", stock: 25,
    description: "Made using Pochampally's resist-dye ikat technique, where yarn is tie-dyed before weaving so the geometric pattern emerges directly from the fabric rather than being printed on top. Lightweight cotton, easy to drape daily." },
  { name: "Chanderi Handwoven Fabric (2m)", category: "fabric", price: 2400, material: "Chanderi Silk-Cotton", region: "Chanderi, MP", stock: 15,
    description: "A silk-cotton blend from Chanderi, Madhya Pradesh, known for its sheer texture and fine, almost translucent weave. Sold as a 2-metre uncut length, ready for tailoring into a kurta, blouse, or dupatta." },
  { name: "Kalamkari Block Print Fabric", category: "fabric", price: 1600, material: "Cotton", region: "Srikalahasti, AP", stock: 20,
    description: "Hand block-printed cotton from Srikalahasti using natural vegetable dyes and hand-carved wooden blocks, depicting the mythological and floral motifs the kalamkari tradition is known for." },
  { name: "Bandhani Tie-Dye Dupatta", category: "fabric", price: 950, material: "Georgette", region: "Kutch, Gujarat", occasion: "Festive", stock: 30,
    description: "Traditional Kutch bandhani tie-dye on lightweight georgette — thousands of tiny hand-tied knots create the dotted pattern before dyeing, a technique passed down through generations of Gujarati artisan families." },
  { name: "Jamdani Cotton Saree", category: "fabric", price: 4200, material: "Cotton", region: "West Bengal", stock: 10,
    description: "A Bengal jamdani saree woven with supplementary-weft technique, where the motifs are worked directly into the weave by hand rather than embroidered afterward — a UNESCO-recognised craft form." },
  { name: "Ajrakh Block Print Stole", category: "fabric", price: 1100, material: "Cotton", region: "Kutch, Gujarat", stock: 22,
    description: "Ajrakh block printing from Kutch involves up to 16 stages of washing, dyeing and hand-block printing using natural indigo and madder root dyes, producing the deep blue-and-red geometric patterns this stole is known for." },
  { name: "Phulkari Embroidered Dupatta", category: "fabric", price: 1800, material: "Cotton-Silk", region: "Punjab", occasion: "Wedding", stock: 12,
    description: "Phulkari ('flower work') embroidery from Punjab, hand-stitched with vibrant silk floss thread in a darning stitch that builds up dense, colourful floral patterns — traditionally made for weddings and festive occasions." },

  { name: "Dhokra Brass Tribal Figurine", category: "home-decor", price: 1450, material: "Brass (Dhokra)", region: "Chhattisgarh", stock: 18,
    description: "Cast using the 4,000-year-old lost-wax dhokra technique practiced by Chhattisgarh's tribal metalworkers — each figurine starts as a wax model wrapped in clay, then the wax is melted out and molten brass poured in, making every piece one-of-a-kind." },
  { name: "Madhubani Painting - Peacock", category: "home-decor", price: 2200, material: "Handmade Paper, Natural Dyes", region: "Bihar", stock: 9,
    description: "Hand-painted in the Madhubani (Mithila) style from Bihar, using natural pigments and fine double-line borders around a peacock motif — a folk art tradition historically painted by women on the walls of their homes." },
  { name: "Blue Pottery Decorative Vase", category: "home-decor", price: 1750, salePrice: 1400, material: "Quartz Ceramic", region: "Jaipur, Rajasthan", stock: 14,
    description: "Jaipur's signature blue pottery, made from a quartz-based ceramic (no clay) that gives the glaze its distinctive cobalt-and-white finish — a craft originally brought to Rajasthan via Persian and Mongol influence." },
  { name: "Warli Art Wall Hanging", category: "home-decor", price: 1300, material: "Canvas, Natural Pigment", region: "Maharashtra", stock: 16,
    description: "Warli painting from Maharashtra's tribal belt, using simple geometric shapes — circles, triangles, and lines — to depict everyday village life, painted in white pigment on a rich earthen-toned canvas ground." },
  { name: "Channapatna Wooden Toy Set", category: "home-decor", price: 850, material: "Ivory Wood", region: "Channapatna, Karnataka", occasion: "Kids", stock: 24,
    description: "Turned and lacquered by Channapatna's woodturners using ivory wood and vegetable dyes, a GI-tagged craft tradition over 200 years old. Smooth, rounded, and safe for small hands." },
  { name: "Pattachitra Hand-Painted Plate", category: "home-decor", price: 1950, material: "Palm Leaf", region: "Odisha", stock: 11,
    description: "Pattachitra artists from Odisha hand-paint mythological scenes onto a treated palm-leaf-and-cloth base using natural stone and mineral pigments, then finish with a lacquer coating for durability." },
  { name: "Rogan Art Wall Panel", category: "home-decor", price: 3200, material: "Castor Oil Paint on Cloth", region: "Kutch, Gujarat", stock: 6,
    description: "Rogan art is painted freehand with a stylus using thick castor-oil-based paint, drawn out from a metal cup rather than brushed — one of the rarest surviving textile art forms in India, kept alive by a handful of families in Nirona, Kutch." },
  { name: "Terracotta Wall Mask", category: "home-decor", price: 1050, material: "Terracotta", region: "West Bengal", stock: 20,
    description: "Hand-shaped and kiln-fired terracotta wall mask from rural West Bengal, a folk craft tradition rooted in temple architecture and village ritual art." },

  { name: "Coir Doormat - Handwoven", category: "household", price: 450, material: "Coconut Coir", region: "Kerala", stock: 40,
    description: "Handwoven from coconut husk coir by Kerala's coir cooperatives, naturally durable and abrasive enough to scrape mud and dust off shoes without shedding." },
  { name: "Bamboo Storage Basket Set", category: "household", price: 1100, material: "Bamboo", region: "Assam", stock: 22,
    description: "Hand-woven bamboo baskets from Assam, split and dried using traditional methods before weaving — a lightweight, breathable option for everyday storage." },
  { name: "Sabai Grass Multipurpose Basket", category: "household", price: 700, material: "Sabai Grass", region: "Odisha", stock: 28,
    description: "Coiled and stitched from sabai grass by artisan groups in Odisha, a wild grass harvested sustainably from the region's forest fringes and twisted into rope before being coiled into shape." },
  { name: "Brass Kansa Thali Set", category: "household", price: 2600, material: "Bell Metal (Kansa)", region: "West Bengal", stock: 10,
    description: "Cast in kansa (bell metal, a bronze alloy) by West Bengal's traditional metalsmiths — kansa is prized in Ayurveda for its believed health benefits and has been used for dining ware in Bengal for centuries." },
  { name: "Handloom Cotton Table Runner", category: "household", price: 650, material: "Cotton", region: "Tamil Nadu", stock: 30,
    description: "Woven on a pit loom by weavers in Tamil Nadu using pure cotton yarn, with a simple striped pattern that suits both everyday and festive table settings." },
  { name: "Moonj Grass Fruit Basket", category: "household", price: 550, material: "Moonj Grass", region: "Uttar Pradesh", stock: 26,
    description: "Coiled from moonj grass by women's craft collectives in Uttar Pradesh, a wild grass traditionally used for storage baskets and now increasingly recognised as a sustainable weaving material." },
  { name: "Copper Water Bottle - Hammered", category: "household", price: 900, material: "Copper", region: "Rajasthan", stock: 35,
    description: "Hand-hammered from pure copper sheet by Rajasthani metalsmiths, each dent from the hammering is visible and unique — copper vessels are a long-standing part of Ayurvedic drinking-water tradition." },

  { name: "Blue Pottery Ceramic Mug", category: "mugs", price: 550, material: "Quartz Ceramic", region: "Jaipur, Rajasthan", stock: 45,
    description: "Jaipur blue pottery in mug form — the same quartz-ceramic body and cobalt glaze as the region's decorative pieces, hand-painted with a floral motif and fired at low temperature, so hand-wash only." },
  { name: "Terracotta Kulhad Mug Set of 4", category: "mugs", price: 480, material: "Terracotta", region: "Uttar Pradesh", stock: 50,
    description: "Traditional kulhad-style terracotta mugs, hand-thrown on a potter's wheel and left unglazed — the porous clay is said to add a faint earthy flavour to tea, the way roadside chai is traditionally served across North India." },
  { name: "Madhubani Hand-Painted Mug", category: "mugs", price: 650, material: "Ceramic", region: "Bihar", stock: 32,
    description: "A ceramic mug hand-painted with Madhubani-style motifs by Bihar's folk artists, bringing the double-line, nature-inspired painting tradition onto everyday tableware." },
  { name: "Warli Art Ceramic Mug", category: "mugs", price: 600, material: "Ceramic", region: "Maharashtra", stock: 32,
    description: "White ceramic mug hand-painted with Warli tribal art from Maharashtra — stick-figure village scenes rendered in the same white-on-earth-tone style as the wall-hanging tradition it comes from." },
  { name: "Copper Moscow Mule Mug", category: "mugs", price: 750, salePrice: 620, material: "Copper", region: "Rajasthan", stock: 28,
    description: "A solid-copper mug hand-finished by Rajasthani metalworkers, the classic Moscow Mule shape — keeps drinks cold longer thanks to copper's high thermal conductivity." },

  { name: "Kashmiri Saffron (5g)", category: "spices", price: 1200, material: "Saffron", region: "Pampore, Kashmir", stock: 50,
    description: "Hand-harvested saffron threads from Pampore, Kashmir's 'saffron town' — each flower yields only three stigmas, hand-picked at dawn during a narrow October harvest window, which is why genuine Kashmiri saffron commands a premium." },
  { name: "Malabar Black Pepper (250g)", category: "spices", price: 380, material: "Pepper", region: "Kerala", stock: 60,
    description: "Sun-dried black peppercorns from Kerala's Malabar coast, historically the region that gave India its name as the 'land of spices' and one of the earliest spice-trade routes in the world." },
  { name: "Kerala Green Cardamom (100g)", category: "spices", price: 650, material: "Cardamom", region: "Kerala", stock: 40,
    description: "Plump green cardamom pods grown in the Cardamom Hills of Kerala's Western Ghats, hand-picked and sun-dried to preserve the essential oils that give it its strong, sweet aroma." },
  { name: "Kashmiri Red Chilli Powder (200g)", category: "spices", price: 350, material: "Chilli", region: "Kashmir", stock: 55,
    description: "Ground from Kashmiri chillies, prized for their deep red colour and mild heat — used across Indian cooking specifically for the colour it lends dishes without overwhelming spiciness." },
  { name: "Wayanad Wild Turmeric (200g)", category: "spices", price: 420, material: "Turmeric", region: "Wayanad, Kerala", stock: 48,
    description: "Sun-dried and stone-ground turmeric from Wayanad's forest-edge farms, a variety grown with minimal intervention and valued for its high curcumin content." },
  { name: "Assam Tea Garden Cinnamon (100g)", category: "spices", price: 400, material: "Cinnamon", region: "Assam", stock: 38,
    description: "Dried cinnamon bark sourced from small growers near Assam's tea estates, hand-rolled into quills the traditional way rather than machine-processed." },
  { name: "Rajasthani Garam Masala Blend (150g)", category: "spices", price: 390, material: "Spice Blend", region: "Rajasthan", stock: 44,
    description: "A whole-spice garam masala blend roasted and ground by hand following a Rajasthani household recipe — cumin, coriander, cloves, cardamom, and cinnamon in traditional proportions." },

  { name: "Handmade Jute Tote Bag", category: "uncategorized", price: 550, material: "Jute", region: "West Bengal", stock: 30,
    description: "Hand-embroidered jute tote from West Bengal, India's largest jute-producing state — a durable, biodegradable alternative to synthetic shopping bags, finished with hand-stitched detailing." },
  { name: "Kolhapuri Leather Chappals", category: "uncategorized", price: 1400, material: "Leather", region: "Kolhapur, Maharashtra", stock: 20,
    description: "Hand-stitched Kolhapuri chappals made using vegetable-tanned leather by Maharashtra's traditional chappal-makers — a GI-tagged craft with roots going back over 800 years." },
  { name: "Meenakari Enamel Jewellery Box", category: "uncategorized", price: 1850, material: "Brass, Enamel", region: "Rajasthan", stock: 14,
    description: "Brass jewellery box hand-enamelled using the meenakari technique, where coloured glass paste is fired into engraved metal grooves — a Mughal-era craft still practiced by Rajasthani goldsmith families." },
  { name: "Handcrafted Marble Coasters (Set of 6)", category: "uncategorized", price: 950, material: "Marble Inlay", region: "Agra, UP", stock: 18,
    description: "Marble coasters inlaid by Agra's craftsmen using the same pietra dura technique developed for the Taj Mahal — semi-precious stone fragments set by hand into white marble." },
  { name: "Naga Handwoven Shawl", category: "uncategorized", price: 2100, material: "Wool-Cotton", region: "Nagaland", occasion: "Festive", stock: 12,
    description: "Woven on a traditional loin loom by Naga weavers, using the bold geometric stripe patterns specific to Naga tribal weaving traditions — warm wool-cotton blend suited to both daily wear and festive occasions." },

  { name: "Kanchipuram Silk Saree - Temple Border", category: "fabric", price: 7200, salePrice: 6400, material: "Silk", region: "Kanchipuram, Tamil Nadu", occasion: "Wedding", stock: 7,
    description: "Woven in Kanchipuram, Tamil Nadu's temple-town silk district, using thick mulberry silk and a temple-motif zari border woven separately then interlocked with the body — a technique unique to Kanchipuram silk that makes the border famously hard-wearing." },
  { name: "Block Printed Silk Scarf", category: "fabric", price: 1350, material: "Silk", region: "Rajasthan", stock: 20,
    description: "Hand block-printed silk scarf using carved wooden blocks and natural dyes, a technique widely practiced across Rajasthan's printing clusters — lightweight enough for year-round wear." },
  { name: "Brass Diya with Stand", category: "home-decor", price: 780, material: "Brass", region: "Moradabad, UP", occasion: "Festive", stock: 26,
    description: "Cast brass diya (oil lamp) on a matching stand from Moradabad — known as India's 'brass city' — traditionally lit during Diwali and other festive occasions." },
  { name: "Brass Incense Holder", category: "home-decor", price: 420, material: "Brass", region: "Moradabad, UP", stock: 34,
    description: "Hand-cast brass incense stick holder with an ash-catching base, made by Moradabad's brassware workshops using traditional sand-casting methods." },
  { name: "Decorative Terracotta Vase", category: "home-decor", price: 890, material: "Terracotta", region: "West Bengal", stock: 22,
    description: "Wheel-thrown terracotta vase with a hand-etched surface pattern, fired in traditional open kilns by West Bengal's potter communities." },
  { name: "Terracotta Water Pot", category: "household", price: 650, material: "Terracotta", region: "Uttar Pradesh", stock: 30,
    description: "Traditional unglazed terracotta water pot (matka) — the porous clay naturally cools water through evaporation, a centuries-old alternative to refrigeration still used in many Indian households." },
  { name: "Traditional Terracotta Diyas Set", category: "home-decor", price: 380, material: "Terracotta", region: "Uttar Pradesh", occasion: "Festive", stock: 60,
    description: "A set of hand-shaped terracotta oil lamps, fired on a potter's wheel — the traditional lighting used across Diwali and other Indian festivals, made by the same potter families who have made them for generations." },
  { name: "Clay Cooking Pot Set", category: "household", price: 1250, material: "Clay", region: "Tamil Nadu", stock: 16,
    description: "Hand-shaped unglazed clay cooking pots from Tamil Nadu potter villages — slow-cooking in clay is believed to retain more nutrients and flavour than metal cookware, and is still preferred for certain traditional dishes." },
  { name: "Clay Water Bottle", category: "household", price: 480, material: "Clay", region: "Rajasthan", stock: 35,
    description: "A hand-thrown clay water bottle designed for daily use, naturally alkalizing and cooling water the way earthen vessels have for centuries in Rajasthan." },
  { name: "Earthenware Dinner Set", category: "household", price: 2100, material: "Earthenware", region: "West Bengal", stock: 12,
    description: "A hand-thrown earthenware dinner set fired in traditional kilns, each piece carrying the slight irregularities that come from being shaped entirely by hand rather than moulded." },
  { name: "Palm Leaf Wall Hanging", category: "home-decor", price: 720, material: "Palm Leaf", region: "Odisha", stock: 24,
    description: "Etched and painted on treated palm leaf by Odisha's pattachitra artisan families, a craft technique that predates paper in the region and is still used for both religious manuscripts and decorative art." },
  { name: "Palm Leaf Table Mats", category: "household", price: 580, material: "Palm Leaf", region: "Tamil Nadu", stock: 30,
    description: "Woven from dried palm leaf strips by artisans in Tamil Nadu — a lightweight, biodegradable table-mat tradition common across South India's coastal regions." },
  { name: "Hand Painted Coasters Set", category: "home-decor", price: 620, material: "Wood", region: "Rajasthan", stock: 28,
    description: "A set of wooden coasters hand-painted with traditional Rajasthani floral motifs, each one painted individually so no two sets are perfectly identical." },
  { name: "Tribal Silver Jewelry Set", category: "uncategorized", price: 3400, material: "Silver", region: "Rajasthan", occasion: "Festive", stock: 8,
    description: "Oxidised silver jewellery set handcrafted by tribal silversmiths in Rajasthan, using traditional stamping and filigree techniques passed down within artisan families for generations." },
  { name: "Bamboo Table Lamp", category: "home-decor", price: 1450, material: "Bamboo", region: "Tripura", stock: 15,
    description: "Handwoven bamboo lamp shade over a wooden base, made by artisans in Tripura using split-bamboo weaving techniques traditionally used for baskets and screens." },
  { name: "Leather Bound Diary", category: "uncategorized", price: 890, material: "Leather, Handmade Paper", region: "Rajasthan", stock: 25,
    description: "Hand-bound diary with a genuine leather cover and handmade cotton-rag paper pages, produced by traditional bookbinders in Rajasthan." },
  { name: "Handmade Paper Journal", category: "uncategorized", price: 420, material: "Handmade Paper", region: "Sanganer, Rajasthan", stock: 40,
    description: "Journal made from handmade cotton-rag paper produced in Sanganer, Rajasthan's traditional papermaking town — each sheet is cast and dried by hand, giving it a slightly textured, deckle-edged finish." },
  { name: "Recycled Paper Notebook Set", category: "uncategorized", price: 350, material: "Recycled Paper", region: "Sanganer, Rajasthan", stock: 45,
    description: "A set of notebooks made from 100% recycled cotton-rag paper by Sanganer's papermaking cooperatives, an eco-friendly alternative to wood-pulp paper." },
  { name: "Jute Shopping Bag", category: "uncategorized", price: 320, material: "Jute", region: "West Bengal", stock: 50,
    description: "A simple, sturdy jute shopping bag woven in West Bengal — plain-weave construction built for everyday grocery runs, fully biodegradable." },
  { name: "Jute Lunch Bag", category: "uncategorized", price: 280, material: "Jute", region: "West Bengal", stock: 42,
    description: "Compact jute lunch bag with reinforced stitching, hand-woven by the same West Bengal jute cooperatives that produce the region's larger tote and shopping bags." },
  { name: "Traditional Wooden Puzzle", category: "home-decor", price: 620, material: "Wood", region: "Channapatna, Karnataka", occasion: "Kids", stock: 20,
    description: "A hand-carved wooden puzzle from Channapatna, finished with the same natural lacquer and vegetable dyes used in the town's famous wooden toy tradition." },
  { name: "Wooden Rocking Horse", category: "home-decor", price: 2400, material: "Wood", region: "Channapatna, Karnataka", occasion: "Kids", stock: 9,
    description: "A hand-turned and lacquered wooden rocking horse from Channapatna's toy workshops, made using the same lightweight ivory wood and child-safe vegetable dyes the region is known for." },
];

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Representative artisan names, loosely regionalized so a product's maker name is at least
// culturally consistent with its stated craft region. This is prototype/demo content per
// UX_STANDARDS.md Section 3 ("[P] Prototype enhancement") and Section 37 (clearly representative,
// not a claim of a verified individual) -- not scraped or claimed as real identified people.
const ARTISAN_POOLS: Record<string, string[]> = {
  rajasthan: ["Radhika Sharma", "Mohan Lal Kumhar", "Sunita Devi", "Girdhari Lal"],
  gujarat: ["Bhavna Rabari", "Ismail Khatri", "Meera Ben", "Jagdish Vankar"],
  "west bengal": ["Alok Das", "Soma Karmakar", "Rina Bibi", "Provat Chandra Pal"],
  karnataka: ["Krishnamurthy Rao", "Lakshmi Achar", "Manjunath Gowda"],
  odisha: ["Bijay Maharana", "Sarita Pattnaik", "Duryodhan Sahoo"],
  bihar: ["Sita Devi", "Baua Devi", "Manisha Jha"],
  maharashtra: ["Jivya Soma Mashe", "Anita Bhoye", "Ramesh Pardhi"],
  "tamil nadu": ["Kannan Murugesan", "Lakshmi Raman", "Selvam Pillai"],
  kerala: ["Radhakrishnan Nair", "Saramma Thomas", "Vinod Kumar"],
  assam: ["Bhaskar Das", "Rita Gogoi", "Pranab Boro"],
  chhattisgarh: ["Sonabai Rajwar", "Jaidev Baghel", "Mangli Bai"],
  punjab: ["Harpreet Kaur", "Amarjeet Singh", "Simranjit Kaur"],
  nagaland: ["Aküm Longchari", "Vimenuo Kire", "Toshi Ao"],
  telangana: ["Lakshmamma", "Ravi Chakali", "Padma Yadav"],
  "madhya pradesh": ["Kailash Chandra", "Gyarasi Bai", "Ramgopal Verma"],
  "andhra pradesh": ["Niranjan Reddy", "Subbalakshmi", "Venkataramana"],
  "uttar pradesh": ["Iqbal Ansari", "Kamla Devi", "Rajendra Prasad Saini"],
  kashmir: ["Ghulam Mohammad Wani", "Zeba Jan", "Bashir Ahmad"],
  tripura: ["Debasish Debbarma", "Rina Tripura", "Sanjib Reang"],
};

function artisanFor(region: string, index: number): string {
  const key = Object.keys(ARTISAN_POOLS).find((k) => region.toLowerCase().includes(k));
  const pool = key ? ARTISAN_POOLS[key] : ["Artisan Collective Member"];
  return pool[index % pool.length];
}

async function main() {
  for (const c of categories) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    });
  }

  const passwordHash = await bcrypt.hash("password123", 10);

  const vendorUser1 = await prisma.user.upsert({
    where: { email: "storefront@indicraft.test" },
    update: {},
    create: {
      name: "Indicraft Storefront",
      email: "storefront@indicraft.test",
      password: passwordHash,
      role: "vendor",
    },
  });
  const vendor1 = await prisma.vendor.upsert({
    where: { userId: vendorUser1.id },
    update: {},
    create: { userId: vendorUser1.id, storeName: "Indicraft Artisans Collective", description: "Curated handcrafted goods from artisans across India." },
  });

  const vendorUser2 = await prisma.user.upsert({
    where: { email: "orders@indicraft.test" },
    update: {},
    create: {
      name: "Indicraft Orders Vendor",
      email: "orders@indicraft.test",
      password: passwordHash,
      role: "vendor",
    },
  });
  const vendor2 = await prisma.vendor.upsert({
    where: { userId: vendorUser2.id },
    update: {},
    create: { userId: vendorUser2.id, storeName: "Heritage Craft Co-op", description: "Direct-from-artisan household and gifting goods." },
  });

  await prisma.user.upsert({
    where: { email: "customer@indicraft.test" },
    update: {},
    create: {
      name: "Test Customer",
      email: "customer@indicraft.test",
      password: passwordHash,
      role: "customer",
    },
  });

  const categoryBySlug = Object.fromEntries(
    (await prisma.category.findMany()).map((c) => [c.slug, c])
  );

  for (const [i, p] of products.entries()) {
    const slug = slugify(p.name);
    const vendor = i % 2 === 0 ? vendor1 : vendor2;
    const category = categoryBySlug[p.category];
    const artisan = artisanFor(p.region, i);
    const product = await prisma.product.upsert({
      where: { slug },
      // Re-running the seed should refresh content (descriptions, prices, stock) on existing
      // rows, not just create missing ones — otherwise a rewritten description here never
      // reaches a DB that was already seeded once.
      update: {
        description: p.description,
        price: p.price,
        salePrice: p.salePrice ?? null,
        stock: p.stock,
        material: p.material,
        region: p.region,
        occasion: p.occasion ?? null,
        artisan,
        categoryId: category.id,
      },
      create: {
        name: p.name,
        slug,
        description: p.description,
        price: p.price,
        salePrice: p.salePrice ?? null,
        stock: p.stock,
        material: p.material,
        region: p.region,
        occasion: p.occasion ?? null,
        artisan,
        vendorId: vendor.id,
        categoryId: category.id,
      },
    });

    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.create({
      data: {
        productId: product.id,
        url: REAL_PRODUCT_IMAGES[slug] ? `/images/products/${REAL_PRODUCT_IMAGES[slug]}` : `https://picsum.photos/seed/${slug}/600/600`,
        altText: p.name,
        position: 0,
      },
    });
  }

  // Fake reviewer accounts, used only to attach display names to seeded reviews.
  const reviewerNames = [
    "Ananya Rao",
    "Vikram Nair",
    "Sneha Kulkarni",
    "Rohan Mehta",
    "Divya Iyer",
    "Arjun Singh",
    "Kavya Reddy",
    "Aditya Ghosh",
  ];
  const reviewers = [];
  for (const name of reviewerNames) {
    const email = `${slugify(name)}@reviewer.indicraft.test`;
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { name, email, password: passwordHash, role: "customer" },
    });
    reviewers.push(user);
  }

  const reviewComments = [
    "Beautiful craftsmanship, exactly as pictured.",
    "Good quality, arrived well packaged.",
    "Loved the colours and finish — will buy again.",
    "Nice piece, slightly smaller than I expected.",
    "Authentic handmade feel, very happy with this.",
    "Great value for the price.",
    null,
    null,
  ];

  const allProducts = await prisma.product.findMany({ select: { id: true } });
  let reviewCount = 0;
  for (const [i, product] of allProducts.entries()) {
    const numReviews = 1 + ((i * 7) % 4); // deterministic spread of 1-4 reviews per product
    for (let r = 0; r < numReviews; r++) {
      const reviewer = reviewers[(i + r) % reviewers.length];
      const rating = 3 + ((i + r) % 3); // 3-5 stars
      await prisma.review.upsert({
        where: { userId_productId: { userId: reviewer.id, productId: product.id } },
        update: {},
        create: {
          userId: reviewer.id,
          productId: product.id,
          rating,
          comment: reviewComments[(i + r) % reviewComments.length],
        },
      });
      reviewCount++;
    }
  }

  console.log(`Seeded ${categories.length} categories, ${products.length} products, and ${reviewCount} reviews.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
