import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const categories = [
  { name: "Fabric", slug: "fabric" },
  { name: "Home Decor", slug: "home-decor" },
  { name: "Household", slug: "household" },
  { name: "Mugs", slug: "mugs" },
  { name: "Spices", slug: "spices" },
  { name: "Jewelry", slug: "jewelry" },
  { name: "Paintings", slug: "paintings" },
  { name: "Gifts & Accessories", slug: "uncategorized" },
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
  "kutch-mirror-work-embroidered-shawl": "kutch-mirror-work-shawl.jpg",
  "chikankari-hand-embroidered-fabric": "chikankari-embroidery-fabric.jpg",
  "cuttack-silver-filigree-earrings": "cuttack-silver-filigree-earrings.jpg",
  "pichwai-painting-shrinathji": "pichwai-painting-shrinathji.jpg",
  "longpi-black-pottery-cooking-pot": "longpi-black-pottery-pot.jpg",
  "pochampally-ikat-saree": "pochampally-ikat-saree.jpg",
  "sambalpuri-ikat-saree": "sambalpuri-ikat-saree.jpg",
  "kalamkari-hand-painted-wall-cloth": "kalamkari-hand-painted-cloth.jpg",
  "assam-muga-silk-mekhela-chador": "mekhela-chador-assam.jpg",
  "kerala-bell-metal-nilavilakku-set": "bell-metal-nilavilakku-set.jpg",
  "rajasthani-lac-bangles-set": "lac-bangles-making.jpg",
  "aranmula-kannadi-metal-mirror": "aranmula-kannadi-mirror.jpg",
  "maheshwari-handloom-saree": "maheshwari-saree-weaver.jpg",
  "pipli-applique-wall-hanging": "pipli-applique-wall-hanging.jpg",
  "chamba-rumal-embroidered-panel": "chamba-rumal-embroidery.jpg",
  "kasuti-embroidered-fabric": "kasuti-embroidered-fabric.jpg",
  "batik-print-fabric": "batik-print-fabric.jpg",
  "kolhapuri-leather-chappals": "kolhapuri-leather-chappals.jpg",
  "assam-tea-garden-cinnamon-100g": "assam-tea-garden-cinnamon.jpg",
  "wayanad-wild-turmeric-200g": "wayanad-wild-turmeric.jpg",
  "kerala-green-cardamom-100g": "kerala-green-cardamom.jpg",
  "copper-moscow-mule-mug": "copper-moscow-mule-mug.jpg",
  "naga-handwoven-shawl": "naga-handwoven-shawl.jpg",
  "malabar-black-pepper-250g": "malabar-black-pepper.jpg",
  "kashmiri-saffron-5g": "kashmiri-saffron.jpg",
  "warli-art-ceramic-mug": "warli-art-mug.jpg",
  "madhubani-hand-painted-mug": "madhubani-mug.jpg",
  "madhubani-painting-peacock": "madhubani-peacock.jpg",
  "blue-pottery-ceramic-mug": "blue-pottery-mug.jpg",
  "copper-water-bottle-hammered": "copper-water-bottle.jpg",
  "pattachitra-hand-painted-plate": "pattachitra-plate.jpg",
  "phulkari-embroidered-dupatta": "phulkari-dupatta.jpg",
  "pashmina-shawl": "pashmina-shawl.jpg",
  "brass-ceremonial-deity-swing": "brass-ceremonial-swing.jpg",
  "dhokra-bell-metal-bull-figurine": "dhokra-bull-figurine.jpg",
  "handwoven-tribal-cotton-textile": "handwoven-tribal-textile.jpg",
  "kutch-embroidered-textile-panel": "kutch-embroidered-panel.jpg",
  "rabari-mirror-work-embroidery-panel": "mirror-work-embroidery-panel.jpg",
  "beadwork-embellished-silk-blouse": "beadwork-embellished-blouse.jpg",
  "bidri-ware-silver-inlay-vase": "bidri-ware-vase.jpg",
  "sandalwood-style-carved-ganesha-idol": "wood-carved-ganesha.jpg",
  "bankura-terracotta-horse": "bankura-terracotta-horse.jpg",
  "rajasthani-kathputli-string-puppet": "kathputli-puppet.jpg",
  "rajasthani-embroidered-mojari": "rajasthani-mojari.jpg",
  "zardozi-embroidered-sheer-fabric": "zardozi-embroidered-fabric.jpg",
  "brass-temple-bell": "brass-temple-bell.jpg",
  "odisha-silver-filigree-pendant-set": "odisha-silver-filigree-pendant.jpg",
  "channapatna-hand-painted-wooden-doll": "channapatna-wooden-doll.jpg",
  "camel-leather-embroidered-bag": "camel-leather-embroidered-bag.jpg",
  "brass-ganesha-idol": "brass-ganesha-idol.jpg",
  "wood-carved-elephant-statue": "wood-carved-elephant-statue.jpg",
  "banarasi-silk-border-fabric": "banarasi-silk-border-fabric.jpg",
  "thanjavur-thalaiyatti-bommai-doll": "thanjavur-doll.jpg",
  "kalamkari-painted-wall-hanging-gita-scene": "kalamkari-gita-wall-hanging.jpg",
  "bronze-nataraja-statue": "bronze-nataraja-statue.jpg",
  "eco-friendly-clay-ganesh-idol": "eco-friendly-clay-ganesh-idol.jpg",
  "shantiniketan-hand-painted-leather-bag": "shantiniketan-leather-bag.jpg",
  "tanjore-repousse-metal-plate": "tanjore-repousse-plate.jpg",
  "kalighat-folk-painting": "kalighat-folk-painting.jpg",
  "himachal-wooden-ritual-mask": "himachal-wooden-ritual-mask.jpg",
  "meenakari-enamel-metal-clutch-bag": "meenakari-metal-clutch-bag.jpg",
  "wood-carved-vishnu-idol": "wood-carved-vishnu-idol.jpg",
  "kathakali-face-figurine": "kathakali-face-figurine.jpg",
  "hand-painted-wooden-serving-tray": "hand-painted-wooden-tray.jpg",
  "hand-painted-terracotta-pot-set": "hand-painted-terracotta-pots.jpg",
  "patchwork-embroidered-wall-runner": "patchwork-embroidered-runner.jpg",
  "mosaic-glass-lamp-shade": "mosaic-glass-lamp-shade.jpg",
  "rajasthani-kathputli-puppet-set": "kathputli-puppet-set.jpg",
  "vintage-style-painted-wooden-figurine": "vintage-painted-wooden-figurine.jpg",
  "woven-cane-mini-basket-set": "cane-mini-basket-set.jpg",
  "rajasthani-beaded-elephant-door-hanging": "rajasthani-beaded-door-hanging.jpg",
};

// Openly-licensed (CC BY / CC BY-SA) photos sourced via Openverse from Wikimedia Commons and
// Flickr -- both licenses legally require visible attribution wherever the image is used, so
// this isn't just record-keeping: ProductGallery/product pages read this and render a credit
// line. Keyed by the same slug as REAL_PRODUCT_IMAGES.
const IMAGE_ATTRIBUTION: Record<string, { creator: string; license: string; sourceUrl: string }> = {
  "kutch-mirror-work-embroidered-shawl": { creator: "RubyGoes", license: "CC BY 2.0", sourceUrl: "https://www.flickr.com/photos/61997808@N00/4195734357" },
  "chikankari-hand-embroidered-fabric": { creator: "Bundleofemotions", license: "CC BY-SA 4.0", sourceUrl: "https://commons.wikimedia.org/w/index.php?curid=146764857" },
  "cuttack-silver-filigree-earrings": { creator: "SpeakingArch", license: "CC BY-SA 4.0", sourceUrl: "https://commons.wikimedia.org/w/index.php?curid=191910814" },
  "pichwai-painting-shrinathji": { creator: "Karodimal/Kajodimal Ratan Lal", license: "CC BY-SA 4.0", sourceUrl: "https://commons.wikimedia.org/w/index.php?curid=138706341" },
  "longpi-black-pottery-cooking-pot": { creator: "Atcelsius", license: "CC BY-SA 4.0", sourceUrl: "https://commons.wikimedia.org/w/index.php?curid=94272237" },
  "pochampally-ikat-saree": { creator: "Ramkumar Kalyani", license: "CC BY-SA 4.0", sourceUrl: "https://commons.wikimedia.org/w/index.php?curid=155536146" },
  "sambalpuri-ikat-saree": { creator: "Lincon Mishra", license: "CC BY-SA 4.0", sourceUrl: "https://commons.wikimedia.org/w/index.php?curid=15186413" },
  "kalamkari-hand-painted-wall-cloth": { creator: "rajaraman sundaram", license: "CC BY 3.0", sourceUrl: "https://commons.wikimedia.org/w/index.php?curid=60342338" },
  "assam-muga-silk-mekhela-chador": { creator: "Chiring chandan", license: "CC BY-SA 4.0", sourceUrl: "https://commons.wikimedia.org/w/index.php?curid=99144172" },
  "kerala-bell-metal-nilavilakku-set": { creator: "Akhilan", license: "CC BY-SA 3.0", sourceUrl: "https://commons.wikimedia.org/w/index.php?curid=14838042" },
  "rajasthani-lac-bangles-set": { creator: "Goutam1962", license: "CC BY-SA 4.0", sourceUrl: "https://commons.wikimedia.org/w/index.php?curid=129224724" },
  "aranmula-kannadi-metal-mirror": { creator: "Prasanth Prakash", license: "CC BY-SA 4.0", sourceUrl: "https://commons.wikimedia.org/w/index.php?curid=101277121" },
  "maheshwari-handloom-saree": { creator: "Eskay001", license: "CC BY-SA 4.0", sourceUrl: "https://commons.wikimedia.org/w/index.php?curid=82529359" },
  "pipli-applique-wall-hanging": { creator: "andryn2006", license: "CC BY-SA 2.0", sourceUrl: "https://www.flickr.com/photos/84985982@N00/24847305973" },
  "chamba-rumal-embroidered-panel": { creator: "Fæ", license: "CC BY 2.0", sourceUrl: "https://www.flickr.com/photos/50398299@N08/16215202147" },
  "kasuti-embroidered-fabric": { creator: "Priya", license: "CC0 1.0", sourceUrl: "https://commons.wikimedia.org/w/index.php?curid=97359138" },
  "batik-print-fabric": { creator: "museado", license: "CC0 1.0", sourceUrl: "https://www.flickr.com/photos/200781279@N05/53865795995" },
  "kolhapuri-leather-chappals": { creator: "Pritam Sonone", license: "CC0 1.0", sourceUrl: "https://wordpress.org/photos/photo/160678607c/" },
  "assam-tea-garden-cinnamon-100g": { creator: "trophygeek", license: "CC BY 2.0", sourceUrl: "https://www.flickr.com/photos/65187097@N03/7309903584" },
  "wayanad-wild-turmeric-200g": { creator: "Steenbergs", license: "CC BY 2.0", sourceUrl: "https://www.flickr.com/photos/50310535@N03/6865121460" },
  "kerala-green-cardamom-100g": { creator: "Misterneedlemouse", license: "CC0 1.0", sourceUrl: "https://commons.wikimedia.org/w/index.php?curid=151971310" },
  "copper-moscow-mule-mug": { creator: "Will Shenton", license: "CC BY-SA 4.0", sourceUrl: "https://commons.wikimedia.org/w/index.php?curid=49675066" },
  "naga-handwoven-shawl": { creator: "RubyGoes", license: "CC BY 2.0", sourceUrl: "https://www.flickr.com/photos/61997808@N00/6902197005" },
  "malabar-black-pepper-250g": { creator: "Dvortygirl", license: "CC BY-SA 3.0", sourceUrl: "https://commons.wikimedia.org/w/index.php?curid=2584751" },
  "kashmiri-saffron-5g": { creator: "ulleo", license: "CC0 1.0", sourceUrl: "https://commons.wikimedia.org/w/index.php?curid=165535448" },
  "warli-art-ceramic-mug": { creator: "brinda05", license: "CC BY 2.0", sourceUrl: "https://www.flickr.com/photos/47218854@N04/4327920957" },
  "madhubani-hand-painted-mug": { creator: "Aaronwarnerella", license: "CC BY 2.0", sourceUrl: "https://commons.wikimedia.org/w/index.php?curid=145911711" },
  "madhubani-painting-peacock": { creator: "Bhuvana Meenakshi", license: "CC BY-SA 4.0", sourceUrl: "https://commons.wikimedia.org/w/index.php?curid=194454892" },
  "blue-pottery-ceramic-mug": { creator: "Neek-Theri", license: "CC BY-SA 4.0", sourceUrl: "https://commons.wikimedia.org/w/index.php?curid=128838642" },
  "copper-water-bottle-hammered": { creator: "Unknown (museum piece)", license: "CC0 1.0", sourceUrl: "https://www.rawpixel.com/image/10139793/lota-water-jar-18th-19th-century-indian" },
  "pattachitra-hand-painted-plate": { creator: "Sumita Roy Dutta", license: "CC BY-SA 4.0", sourceUrl: "https://commons.wikimedia.org/w/index.php?curid=100119903" },
  "phulkari-embroidered-dupatta": { creator: "Hiart", license: "CC0 1.0", sourceUrl: "https://commons.wikimedia.org/w/index.php?curid=25871820" },
  "pashmina-shawl": { creator: "Hiart", license: "CC0 1.0", sourceUrl: "https://commons.wikimedia.org/w/index.php?curid=73832006" },
  "brass-ceremonial-deity-swing": { creator: "quizzycal", license: "CC0 1.0", sourceUrl: "https://wordpress.org/photos/photo/45640e2940/" },
  "dhokra-bell-metal-bull-figurine": { creator: "Shoot stufz", license: "CC BY-SA 4.0", sourceUrl: "https://commons.wikimedia.org/w/index.php?curid=163017910" },
  "handwoven-tribal-cotton-textile": { creator: "RubyGoes", license: "CC BY 2.0", sourceUrl: "https://www.flickr.com/photos/61997808@N00/5104481744" },
  "kutch-embroidered-textile-panel": { creator: "RubyGoes", license: "CC BY 2.0", sourceUrl: "https://www.flickr.com/photos/61997808@N00/8019238560" },
  "rabari-mirror-work-embroidery-panel": { creator: "RubyGoes", license: "CC BY 2.0", sourceUrl: "https://www.flickr.com/photos/61997808@N00/8210799324" },
  "beadwork-embellished-silk-blouse": { creator: "RubyGoes", license: "CC BY 2.0", sourceUrl: "https://www.flickr.com/photos/61997808@N00/5453324178" },
  "bidri-ware-silver-inlay-vase": { creator: "Unknown (museum piece)", license: "CC0 1.0", sourceUrl: "https://www.rawpixel.com/image/7656405/photo-image-vintage-art-public-domain" },
  "sandalwood-style-carved-ganesha-idol": { creator: "exfordy", license: "CC BY 2.0", sourceUrl: "https://www.flickr.com/photos/32659528@N00/160302356" },
  "bankura-terracotta-horse": { creator: "Rajes jana", license: "CC BY-SA 4.0", sourceUrl: "https://commons.wikimedia.org/w/index.php?curid=94296269" },
  "rajasthani-kathputli-string-puppet": { creator: "Manojmeena", license: "CC BY-SA 4.0", sourceUrl: "https://commons.wikimedia.org/w/index.php?curid=144963208" },
  "rajasthani-embroidered-mojari": { creator: "RubyGoes", license: "CC BY 2.0", sourceUrl: "https://www.flickr.com/photos/61997808@N00/4801577556" },
  "zardozi-embroidered-sheer-fabric": { creator: "Bundleofemotions", license: "CC BY-SA 4.0", sourceUrl: "https://commons.wikimedia.org/w/index.php?curid=146764859" },
  "brass-temple-bell": { creator: "Ravi Kumar", license: "CC BY 2.0", sourceUrl: "https://commons.wikimedia.org/w/index.php?curid=71294416" },
  "odisha-silver-filigree-pendant-set": { creator: "ଆଶୁତୋଷ କର", license: "CC BY-SA 4.0", sourceUrl: "https://commons.wikimedia.org/w/index.php?curid=15841167" },
  "channapatna-hand-painted-wooden-doll": { creator: "MaximusPrasad", license: "CC BY-SA 4.0", sourceUrl: "https://commons.wikimedia.org/w/index.php?curid=161028835" },
  "camel-leather-embroidered-bag": { creator: "RubyGoes", license: "CC BY 2.0", sourceUrl: "https://www.flickr.com/photos/61997808@N00/5240366801" },
  "brass-ganesha-idol": { creator: "Juhele_CZ", license: "CC0 1.0", sourceUrl: "https://www.flickr.com/photos/96541566@N06/51759567354" },
  "wood-carved-elephant-statue": { creator: "Rabe!", license: "CC BY-SA 4.0", sourceUrl: "https://commons.wikimedia.org/w/index.php?curid=73861103" },
  "banarasi-silk-border-fabric": { creator: "RubyGoes", license: "CC BY 2.0", sourceUrl: "https://www.flickr.com/photos/61997808@N00/5266040270" },
  "thanjavur-thalaiyatti-bommai-doll": { creator: "Balaji.B Photography", license: "Public Domain Mark", sourceUrl: "https://www.flickr.com/photos/81073027@N00/29055440937" },
  "kalamkari-painted-wall-hanging-gita-scene": { creator: "కాసుబాబు", license: "CC BY-SA 4.0", sourceUrl: "https://commons.wikimedia.org/w/index.php?curid=130167511" },
  "bronze-nataraja-statue": { creator: "mckaysavage", license: "CC BY 2.0", sourceUrl: "https://commons.wikimedia.org/w/index.php?curid=18647124" },
  "eco-friendly-clay-ganesh-idol": { creator: "VedSutra", license: "CC BY-SA 4.0", sourceUrl: "https://commons.wikimedia.org/w/index.php?curid=51264753" },
  "shantiniketan-hand-painted-leather-bag": { creator: "Sneha G Gupta", license: "CC BY-SA 4.0", sourceUrl: "https://commons.wikimedia.org/w/index.php?curid=157760300" },
  "tanjore-repousse-metal-plate": { creator: "nathanh100", license: "CC BY 2.0", sourceUrl: "https://www.flickr.com/photos/41383869@N07/6942793747" },
  "kalighat-folk-painting": { creator: "clevelandart", license: "CC0 1.0", sourceUrl: "https://www.rawpixel.com/image/9715658/maid-bringing-hookah-lady-recto-from-kalighat-album" },
  "himachal-wooden-ritual-mask": { creator: "Saptarshidotmajumdar", license: "CC BY-SA 4.0", sourceUrl: "https://commons.wikimedia.org/w/index.php?curid=146784242" },
  "meenakari-enamel-metal-clutch-bag": { creator: "Monis Yousafzai", license: "Unsplash License", sourceUrl: "https://unsplash.com/@monisyousafzai" },
  "wood-carved-vishnu-idol": { creator: "Amol Nakve", license: "Pexels License", sourceUrl: "https://www.pexels.com/@amol-nakve" },
  "kathakali-face-figurine": { creator: "Amol Nakve", license: "Pexels License", sourceUrl: "https://www.pexels.com/@amol-nakve" },
  "hand-painted-wooden-serving-tray": { creator: "Atharv Ingle", license: "Pexels License", sourceUrl: "https://www.pexels.com/@atharv-ingle" },
  "hand-painted-terracotta-pot-set": { creator: "Eiakash", license: "Pexels License", sourceUrl: "https://www.pexels.com/@eiakash" },
  "patchwork-embroidered-wall-runner": { creator: "Harsh Kukadiya", license: "Pexels License", sourceUrl: "https://www.pexels.com/@harsh-kukadiya" },
  "mosaic-glass-lamp-shade": { creator: "Kaiwalya", license: "Pexels License", sourceUrl: "https://www.pexels.com/@kaiwalya" },
  "rajasthani-kathputli-puppet-set": { creator: "Karan Bipate", license: "Pexels License", sourceUrl: "https://www.pexels.com/@karan-bipate" },
  "vintage-style-painted-wooden-figurine": { creator: "Yashh Clipverse", license: "Pexels License", sourceUrl: "https://www.pexels.com/@yashh-clipverse" },
  "woven-cane-mini-basket-set": { creator: "Steve Mushero", license: "Unsplash License", sourceUrl: "https://unsplash.com/@stevemushero" },
  "rajasthani-beaded-elephant-door-hanging": { creator: "Tamara Malaniy", license: "Unsplash License", sourceUrl: "https://unsplash.com/@tamaramalaniy" },
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
  { name: "Jamdani Cotton Saree", category: "fabric", price: 4200, material: "Cotton", region: "West Bengal", stock: 10,
    description: "A Bengal jamdani saree woven with supplementary-weft technique, where the motifs are worked directly into the weave by hand rather than embroidered afterward — a UNESCO-recognised craft form." },
  { name: "Ajrakh Block Print Stole", category: "fabric", price: 1100, material: "Cotton", region: "Kutch, Gujarat", stock: 22,
    description: "Ajrakh block printing from Kutch involves up to 16 stages of washing, dyeing and hand-block printing using natural indigo and madder root dyes, producing the deep blue-and-red geometric patterns this stole is known for." },
  { name: "Phulkari Embroidered Dupatta", category: "fabric", price: 1800, material: "Cotton-Silk", region: "Punjab", occasion: "Wedding", stock: 12,
    description: "Phulkari ('flower work') embroidery from Punjab, hand-stitched with vibrant silk floss thread in a darning stitch that builds up dense, colourful floral patterns — traditionally made for weddings and festive occasions." },

  { name: "Dhokra Brass Tribal Figurine", category: "home-decor", price: 1450, material: "Brass (Dhokra)", region: "Chhattisgarh", stock: 18,
    description: "Cast using the 4,000-year-old lost-wax dhokra technique practiced by Chhattisgarh's tribal metalworkers — each figurine starts as a wax model wrapped in clay, then the wax is melted out and molten brass poured in, making every piece one-of-a-kind." },
  { name: "Madhubani Painting - Peacock", category: "paintings", price: 2200, material: "Handmade Paper, Natural Dyes", region: "Bihar", stock: 9,
    description: "Hand-painted in the Madhubani (Mithila) style from Bihar, using natural pigments and fine double-line borders around a peacock motif — a folk art tradition historically painted by women on the walls of their homes." },
  { name: "Blue Pottery Decorative Vase", category: "home-decor", price: 1750, salePrice: 1400, material: "Quartz Ceramic", region: "Jaipur, Rajasthan", stock: 14,
    description: "Jaipur's signature blue pottery, made from a quartz-based ceramic (no clay) that gives the glaze its distinctive cobalt-and-white finish — a craft originally brought to Rajasthan via Persian and Mongol influence." },
  { name: "Warli Art Wall Hanging", category: "home-decor", price: 1300, material: "Canvas, Natural Pigment", region: "Maharashtra", stock: 16,
    description: "Warli painting from Maharashtra's tribal belt, using simple geometric shapes — circles, triangles, and lines — to depict everyday village life, painted in white pigment on a rich earthen-toned canvas ground." },
  { name: "Channapatna Wooden Toy Set", category: "home-decor", price: 850, material: "Ivory Wood", region: "Channapatna, Karnataka", occasion: "Kids", stock: 24,
    description: "Turned and lacquered by Channapatna's woodturners using ivory wood and vegetable dyes, a GI-tagged craft tradition over 200 years old. Smooth, rounded, and safe for small hands." },
  { name: "Pattachitra Hand-Painted Plate", category: "home-decor", price: 1950, material: "Palm Leaf", region: "Odisha", stock: 11,
    description: "Pattachitra artists from Odisha hand-paint mythological scenes onto a treated palm-leaf-and-cloth base using natural stone and mineral pigments, then finish with a lacquer coating for durability." },
  { name: "Brass Kansa Thali Set", category: "household", price: 2600, material: "Bell Metal (Kansa)", region: "West Bengal", stock: 10,
    description: "Cast in kansa (bell metal, a bronze alloy) by West Bengal's traditional metalsmiths — kansa is prized in Ayurveda for its believed health benefits and has been used for dining ware in Bengal for centuries." },
  { name: "Copper Water Bottle - Hammered", category: "household", price: 900, material: "Copper", region: "Rajasthan", stock: 35,
    description: "Hand-hammered from pure copper sheet by Rajasthani metalsmiths, each dent from the hammering is visible and unique — copper vessels are a long-standing part of Ayurvedic drinking-water tradition." },

  { name: "Blue Pottery Ceramic Mug", category: "mugs", price: 550, material: "Quartz Ceramic", region: "Jaipur, Rajasthan", stock: 45,
    description: "Jaipur blue pottery in mug form — the same quartz-ceramic body and cobalt glaze as the region's decorative pieces, hand-painted with a floral motif and fired at low temperature, so hand-wash only." },
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
  { name: "Wayanad Wild Turmeric (200g)", category: "spices", price: 420, material: "Turmeric", region: "Wayanad, Kerala", stock: 48,
    description: "Sun-dried and stone-ground turmeric from Wayanad's forest-edge farms, a variety grown with minimal intervention and valued for its high curcumin content." },
  { name: "Assam Tea Garden Cinnamon (100g)", category: "spices", price: 400, material: "Cinnamon", region: "Assam", stock: 38,
    description: "Dried cinnamon bark sourced from small growers near Assam's tea estates, hand-rolled into quills the traditional way rather than machine-processed." },
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
  { name: "Tribal Silver Jewelry Set", category: "jewelry", price: 3400, material: "Silver", region: "Rajasthan", occasion: "Festive", stock: 8,
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

  // Catalog-expansion batch: real openly-licensed photos (Openverse -> Wikimedia Commons/Flickr,
  // commercial-safe licenses only), sourced and hand-reviewed for accuracy against each item's
  // real craft tradition rather than matched by title alone.
  { name: "Kutch Mirror-Work Embroidered Shawl", category: "fabric", price: 2800, material: "Wool, Mirror-work", region: "Kutch, Gujarat", occasion: "Festive", stock: 10,
    description: "Hand-embroidered woolen shawl from Kutch, Gujarat, using the region's signature abhla (mirror-work) technique -- small mirrors stitched into dense floral embroidery, traditionally worn during festivals and weddings." },
  { name: "Chikankari Hand-Embroidered Fabric", category: "fabric", price: 1450, material: "Cotton", region: "Lucknow, Uttar Pradesh", stock: 24,
    description: "White-on-white shadow embroidery from Lucknow, stitched entirely by hand using a wooden hoop -- one of India's most delicate embroidery traditions, dating back to the Mughal court." },
  { name: "Pochampally Ikat Saree", category: "fabric", price: 3600, salePrice: 3100, material: "Silk-Cotton", region: "Pochampally, Telangana", occasion: "Wedding", stock: 9,
    description: "Double-ikat weave from Pochampally, Telangana, where both the warp and weft threads are tie-dyed before weaving so the geometric diamond pattern emerges from the fabric itself -- a slower, more exacting technique than single-ikat." },
  { name: "Sambalpuri Ikat Saree", category: "fabric", price: 3900, material: "Silk", region: "Sonepur, Odisha", occasion: "Festive", stock: 8,
    description: "Handwoven Sambalpuri saree from Odisha, known for its bandha (tie-dye) technique and traditional motifs like the shankha (conch) and chakra (wheel) woven directly into the fabric." },
  { name: "Kalamkari Hand-Painted Wall Cloth", category: "home-decor", price: 2100, material: "Cotton", region: "Srikalahasti, Andhra Pradesh", stock: 11,
    description: "Entirely hand-painted (not block-printed) kalamkari cloth from Srikalahasti, using a bamboo pen and natural dyes to freehand mythological and floral motifs -- a slower, more painterly variant of the kalamkari tradition." },
  { name: "Assam Muga Silk Mekhela Chador", category: "fabric", price: 5200, material: "Muga Silk", region: "Assam", occasion: "Festive", stock: 6,
    description: "Traditional two-piece Assamese garment woven from muga silk, a golden-sheened wild silk unique to Assam that grows more lustrous with each wash -- prized enough to have its own GI tag separate from other silks." },
  { name: "Kerala Bell Metal Nilavilakku Set", category: "home-decor", price: 1600, material: "Bell Metal", region: "Kerala", occasion: "Festive", stock: 15,
    description: "Traditional Kerala oil lamps cast in bell metal, sold as a graduated set -- nilavilakku are lit daily in many Kerala households and are a fixture of temple and wedding rituals across the state." },
  { name: "Rajasthani Lac Bangles Set", category: "jewelry", price: 650, material: "Lac, Glass", region: "Rajasthan", occasion: "Festive", stock: 30,
    description: "Hand-molded lac bangles from Rajasthan -- lac resin is heated, shaped by hand around a metal rod, and studded with mirrors or stones while still warm, a technique little-changed for generations." },
  { name: "Cuttack Silver Filigree Earrings", category: "jewelry", price: 2400, material: "Silver", region: "Cuttack, Odisha", occasion: "Wedding", stock: 12,
    description: "Tarakasi (silver filigree) earrings from Cuttack, made by drawing silver into fine wire and hand-coiling it into intricate openwork patterns -- a GI-tagged craft over a thousand years old." },
  { name: "Pichwai Painting - Shrinathji", category: "paintings", price: 4200, material: "Cloth, Natural Pigment", region: "Nathdwara, Rajasthan", stock: 5,
    description: "Traditional pichwai painting from Nathdwara depicting Shrinathji, hand-painted on cloth in the elaborate devotional style used to backdrop temple shrines -- rich in gold detailing and symbolic motifs." },
  { name: "Aranmula Kannadi Metal Mirror", category: "home-decor", price: 3800, material: "Metal Alloy", region: "Aranmula, Kerala", stock: 7,
    description: "Handmade metal-alloy mirror from Aranmula, Kerala -- unlike glass mirrors, the reflective surface is the polished metal itself, made from a closely-guarded family alloy recipe and GI-tagged to this one village." },
  { name: "Longpi Black Pottery Cooking Pot", category: "household", price: 1900, material: "Black Serpentine Clay", region: "Longpi, Manipur", stock: 10,
    description: "Hand-shaped cookware from Longpi, Manipur, made from black serpentine clay without a potter's wheel -- one of the few pottery traditions in India that skips the wheel entirely, shaped instead by hand and paddle." },

  // Catalog-expansion batch 3.
  { name: "Maheshwari Handloom Saree", category: "fabric", price: 3200, material: "Silk-Cotton", region: "Maheshwar, Madhya Pradesh", stock: 8,
    description: "Woven on traditional pit looms in Maheshwar, Madhya Pradesh, a town whose weaving tradition dates back to the 18th-century patronage of Queen Ahilyabai Holkar -- known for its lightweight silk-cotton blend and reversible border design." },
  { name: "Pipli Applique Wall Hanging", category: "home-decor", price: 1350, material: "Cotton, Mirror-work", region: "Pipli, Odisha", occasion: "Festive", stock: 16,
    description: "Hand-appliqued cotton wall hanging from Pipli, Odisha, where colourful fabric cutouts -- often peacocks, elephants, and floral motifs -- are stitched onto a base cloth, a craft historically used for temple umbrellas and chariot canopies during Puri's Rath Yatra." },
  { name: "Chamba Rumal Embroidered Panel", category: "fabric", price: 2900, material: "Silk on Cotton", region: "Chamba, Himachal Pradesh", stock: 6,
    description: "Double-satin-stitch embroidery from Chamba, Himachal Pradesh, worked so precisely that the same image appears identical on both sides of the cloth -- traditionally depicting mythological scenes, once presented as ceremonial gifts by Himalayan royal courts." },
  { name: "Kasuti Embroidered Fabric", category: "fabric", price: 1100, material: "Cotton", region: "Karnataka", stock: 20,
    description: "Traditional Karnataka embroidery counted and stitched thread-by-thread onto the fabric's own weave (no printed guide pattern), producing geometric motifs identical on both front and back -- traditionally hand-stitched into a bride's wedding saree." },
  { name: "Batik Print Fabric", category: "fabric", price: 950, material: "Cotton", region: "West Bengal, Gujarat", stock: 25,
    description: "Wax-resist dyeing craft where molten wax is hand-applied to the cloth in a floral or geometric pattern before dyeing, blocking the dye from those areas; the wax is later boiled off to reveal the design, often repeated in several dye baths for multi-colour work." },
  { name: "Pashmina Shawl", category: "fabric", price: 4500, material: "Pashmina Wool", region: "Kashmir", stock: 12,
    description: "Woven from the fine undercoat fibre of the Changthangi mountain goat, hand-spun and hand-woven on a traditional loom in Kashmir; the resulting shawl is prized for being warm enough for Himalayan winters yet light enough to pass through a finger ring, often finished with hand-embroidered paisley (boteh) borders." },
  { name: "Brass Ceremonial Deity Swing", category: "home-decor", price: 2800, material: "Brass", region: "South India", stock: 8,
    description: "A cast-brass ceremonial hindola (swing) used to seat and gently rock a small deity idol during home worship, hand-finished with repoussé bird and floral scrollwork along the crossbar — a traditional pooja-room fixture found across South Indian households." },
  { name: "Dhokra Bell Metal Bull Figurine", category: "home-decor", price: 1650, material: "Bell Metal (Dhokra)", region: "Madhya Pradesh", stock: 15,
    description: "Modelled first as a beeswax figure decorated with fine coiled-wax jewellery detail, then cast in bell metal using the same 4,000-year-old lost-wax dhokra process as the region's tribal metalworkers — each finished bull is one-of-a-kind, since the wax original is destroyed in casting." },
  { name: "Handwoven Tribal Cotton Textile", category: "fabric", price: 1200, material: "Cotton", region: "India", stock: 20,
    description: "A hand-spun, hand-woven cotton textile in a bold striped pattern, produced on a pit loom the way rural weaving communities across India have worked for generations — no two lengths come off the loom quite the same." },
  { name: "Kutch Embroidered Textile Panel", category: "fabric", price: 1400, material: "Cotton, Silk Thread", region: "Kutch, Gujarat", stock: 14,
    description: "Densely hand-embroidered panel from Kutch using chain stitch and interlacing thread work in a geometric border pattern — this style of embroidery is traditionally worked onto garment hems, bags, and home textiles by Gujarati artisan communities." },
  { name: "Rabari Mirror-Work Embroidery Panel", category: "fabric", price: 1500, material: "Cotton, Mirror (Shisha)", region: "Kutch, Gujarat", stock: 12,
    description: "Hand-embroidered by Rabari artisans using the shisha (mirror-work) technique, where small round mirrors are stitched into the fabric surrounded by dense geometric embroidery — traditionally worked onto blouses, bags, and wall hangings." },
  { name: "Beadwork Embellished Silk Blouse", category: "fabric", price: 1900, material: "Silk, Glass Beads", region: "India", stock: 10,
    description: "A silk blouse piece hand-embellished with pearl-effect beadwork and gota trim in a dense necklace-style pattern around the neckline — a dressier, festive counterpart to plainer everyday embroidery styles." },
  { name: "Bidri Ware Silver-Inlay Vase", category: "home-decor", price: 4200, material: "Zinc-Copper Alloy, Silver Inlay", region: "Bidar, Karnataka", stock: 7,
    description: "Cast in a blackened zinc-copper alloy and hand-inlaid with pure silver wire and sheet in a floral pattern, then oxidised with a local soil-and-ammonium-chloride paste that blackens the base metal while leaving the silver bright — a Bidar craft with roots in 14th-century Persian metalwork." },
  { name: "Sandalwood-Style Carved Ganesha Idol", category: "home-decor", price: 2600, material: "Carved Wood", region: "Kerala", stock: 11,
    description: "A hand-carved Ganesha idol worked in fine relief with traditional jewellery and throne detailing by Kerala's wood-carving artisans, finished to a smooth natural glow without paint or lacquer." },
  { name: "Bankura Terracotta Horse", category: "home-decor", price: 1350, material: "Terracotta", region: "Bankura, West Bengal", stock: 18,
    description: "The iconic elongated-neck terracotta horse of Bankura's Panchmura village potters, hand-built in sections on a wheel and joined before firing — originally made as votive offerings to the folk deity Dharmathakur, now Bengal's best-known craft emblem, featured on India Post's own crafts stamps." },
  { name: "Rajasthani Kathputli String Puppet", category: "home-decor", price: 1100, material: "Wood, Cotton, Metallic Thread", region: "Rajasthan", stock: 16,
    description: "A traditional wooden-headed string puppet dressed in dense zari and sequin embroidery, hand-carved and costumed by Rajasthan's kathputli puppeteer communities — historically performed as folk theatre narrating royal legends and morality tales." },
  { name: "Rajasthani Embroidered Mojari", category: "uncategorized", price: 1250, material: "Leather, Embroidery Thread", region: "Rajasthan", stock: 20,
    description: "Flat, pointed-toe leather mojari hand-embroidered with metallic thread and tasselled anklet ties, worn across North India for weddings and festive occasions — softer and lighter than the thicker-soled Kolhapuri chappal." },
  { name: "Zardozi Embroidered Sheer Fabric", category: "fabric", price: 1750, material: "Georgette, Metallic Thread", region: "Uttar Pradesh", stock: 13,
    description: "Sheer fabric worked with zardozi — a heavy metallic-thread embroidery technique using gold and silver wire, once reserved for royal courts — raised into dimensional floral sprigs across the cloth." },
  { name: "Brass Temple Bell", category: "home-decor", price: 1450, material: "Brass", region: "South India", stock: 14,
    description: "Cast-brass bell in the temple tradition, hung to be rung on entry as a call to presence and attention before worship — a smaller pooja-room version of the large bells found at South Indian temple entrances." },
  { name: "Odisha Silver Filigree Pendant Set", category: "jewelry", price: 3200, material: "Silver (Tarkasi)", region: "Cuttack, Odisha", stock: 9,
    description: "Cuttack's tarkasi filigree work, where pure silver is drawn into fine wire and coiled into intricate sunflower motifs — a craft requiring years of apprenticeship, since the wirework is shaped entirely by hand with no moulds." },
  { name: "Channapatna Hand-Painted Wooden Doll", category: "home-decor", price: 950, material: "Ivory Wood, Vegetable Dye", region: "Channapatna, Karnataka", occasion: "Kids", stock: 22,
    description: "A turned wooden doll hand-painted in Channapatna's signature lacquer technique, where vegetable-dye colour is applied with a cloth to the spinning wood on a lathe — the same GI-tagged craft behind the region's toy tradition." },
  { name: "Camel Leather Embroidered Bag", category: "uncategorized", price: 2100, material: "Camel Leather, Embroidery Thread", region: "Ajmer, Rajasthan", stock: 11,
    description: "A camel-leather bag panel hand-embroidered in dense Rajasthani thread and mirror work, made using vegetable-tanned camel hide — a traditional leathercraft from the desert regions around Ajmer and Bikaner." },
  { name: "Brass Ganesha Idol", category: "home-decor", price: 2400, material: "Brass", region: "India", stock: 10,
    description: "A cast-brass Ganesha idol in a seated pose with traditional jewellery and throne detailing — a household pooja staple, invoked at the start of any new venture or celebration as the remover of obstacles." },
  { name: "Wood-Carved Elephant Statue", category: "home-decor", price: 2900, material: "Carved Wood", region: "Kerala", stock: 8,
    description: "A caparisoned elephant hand-carved in high relief, replicating the ceremonial dress worn by temple elephants during South Indian festival processions — trunk raised in a traditional blessing gesture." },
  { name: "Banarasi Silk Border Fabric", category: "fabric", price: 2200, material: "Silk, Zari", region: "Varanasi, Uttar Pradesh", stock: 15,
    description: "A woven zari-brocade border cut from Banarasi silk, the gold-and-silver metallic thread worked directly into the weave on a jacquard handloom — the same border technique that trims Varanasi's famous wedding sarees." },
  { name: "Thanjavur Thalaiyatti Bommai Doll", category: "home-decor", price: 1450, material: "Plaster, Papier-Mache", region: "Thanjavur, Tamil Nadu", occasion: "Kids", stock: 16,
    description: "A weighted-base 'dancing doll' from Thanjavur, hand-modelled and painted in bright traditional dance costume — a hollow lower body and rounded base make the figure bob and nod when nudged, an old parlour-trick craft found in Tamil Nadu households for generations." },
  { name: "Kalamkari Painted Wall Hanging - Gita Scene", category: "paintings", price: 2800, material: "Cotton, Natural Dyes", region: "Andhra Pradesh", stock: 8,
    description: "Hand-painted with a fine squirrel-hair pen (kalam) using natural dyes fixed with repeated washing and sun-drying, depicting a classical chariot scene from the Bhagavad Gita — narrative kalamkari painting has decorated temple hangings and scrolls in Andhra Pradesh for centuries." },
  { name: "Bronze Nataraja Statue", category: "home-decor", price: 5200, material: "Bronze", region: "Tamil Nadu", stock: 6,
    description: "Shiva cast in the Nataraja pose — cosmic dancer within a ring of fire — following the same lost-wax bronze-casting tradition established under the Chola dynasty a thousand years ago, still practiced by hereditary sthapathi sculptor families in Tamil Nadu." },
  { name: "Eco-Friendly Clay Ganesh Idol", category: "home-decor", price: 850, material: "Natural Clay", region: "Maharashtra", occasion: "Festive", stock: 30,
    description: "Hand-modelled from natural, unfired clay with no plaster of paris or synthetic paint, made specifically to dissolve safely in water for Ganesh Chaturthi visarjan (immersion) — a shift many potter communities have made in response to concerns about idol immersion polluting lakes and rivers." },
  { name: "Shantiniketan Hand-Painted Leather Bag", category: "uncategorized", price: 1800, material: "Leather", region: "Shantiniketan, West Bengal", stock: 14,
    description: "Vegetable-dyed leather hand-painted with folk motifs — camels, elephants, courtly figures — a craft that grew up around Rabindranath Tagore's university town of Shantiniketan and remains one of West Bengal's best-known leather traditions." },
  { name: "Tanjore Repousse Metal Plate", category: "home-decor", price: 3600, material: "Copper, Silver, Brass", region: "Thanjavur, Tamil Nadu", stock: 7,
    description: "A decorative plate worked in repousse — hammered from the reverse side to raise a relief design — combining copper, silver, and brass in a radiating lotus-and-deity pattern, a metalworking tradition tied to the same Thanjavur court patronage that produced the region's paintings and bronzes." },
  { name: "Kalighat Folk Painting", category: "paintings", price: 1900, material: "Watercolour on Paper", region: "Kolkata, West Bengal", stock: 10,
    description: "Painted in the bold, sweeping-brushstroke style that emerged near Kolkata's Kalighat temple in the 19th century — originally sold as inexpensive souvenirs to temple pilgrims, the style's flat colour and fluid outline later influenced modern Indian art." },
  { name: "Himachal Wooden Ritual Mask", category: "home-decor", price: 2200, material: "Carved Wood", region: "Kullu, Himachal Pradesh", stock: 9,
    description: "Hand-carved wooden mask in the style worn during Himachal Pradesh's Faguli festival, when village deities are represented by masked performers in midwinter rituals — each mask carved with an individual face and left unpainted or finished with simple natural pigment." },
  { name: "Meenakari Enamel Metal Clutch Bag", category: "uncategorized", price: 2800, material: "Metal, Enamel", region: "Rajasthan", occasion: "Wedding", stock: 10,
    description: "A hand-finished metal clutch with meenakari enamel work set into an engraved surface — the same fire-enamelling technique used on Rajasthani jewellery, adapted onto a purse frame with a chain strap for evening wear." },
  { name: "Wood-Carved Vishnu Idol", category: "home-decor", price: 3400, material: "Carved Wood", region: "South India", stock: 8,
    description: "A finely detailed wood-carved idol in a South Indian temple style, with a tall crown, ornamental halo, and traditional four-armed iconography carved in high relief by hand — the kind of devotional woodcarving found at temple craft markets across the South." },
  { name: "Kathakali Face Figurine", category: "home-decor", price: 1350, material: "Terracotta, Fabric", region: "Kerala", stock: 15,
    description: "A decorative figurine modelled on the elaborate green-and-red face paint and towering headdress of Kathakali, Kerala's classical dance-drama form — the headdress finished in cloth and cord the way real performance costumes are built up." },
  { name: "Hand-Painted Wooden Serving Tray", category: "home-decor", price: 1450, material: "Wood, Lacquer", region: "Odisha", stock: 18,
    description: "A wooden tray hand-painted with bright folk-art birds and Radha-Krishna motifs in the flat, decorative style shared with Odisha's Pattachitra tradition, sealed with a glossy lacquer finish for everyday serving use." },
  { name: "Hand-Painted Terracotta Pot Set", category: "home-decor", price: 750, material: "Terracotta", region: "India", stock: 24,
    description: "Small terracotta pots individually hand-painted in bright pink, red, and natural clay tones — traditionally used to hold Holi colour powder or as festive votive pots, sold here as a decorative set." },
  { name: "Patchwork Embroidered Wall Runner", category: "fabric", price: 2600, material: "Recycled Silk, Cotton, Embroidery", region: "Rajasthan", stock: 9,
    description: "A table or wall runner pieced together from vintage sari and garment fragments — mirror work, zari embroidery, and block print scraps stitched into a single patchwork panel, no two runners alike since the source fabric never repeats." },
  { name: "Mosaic Glass Lamp Shade", category: "home-decor", price: 1650, material: "Glass Mosaic, Metal Frame", region: "India", stock: 16,
    description: "A lamp shade hand-set with hundreds of small coloured glass mosaic pieces over a perforated metal frame, glowing in jewel tones when lit — a decorative lighting craft produced in workshops across northern India." },
  { name: "Rajasthani Kathputli Puppet Set", category: "home-decor", price: 1900, material: "Wood, Cotton, Metallic Thread", region: "Rajasthan", stock: 12,
    description: "A set of traditional wooden-headed kathputli string puppets in full court dress, sold together the way they're traditionally displayed hanging in a row — companion piece to Rajasthan's centuries-old puppet-theatre tradition." },
  { name: "Vintage-Style Painted Wooden Figurine", category: "home-decor", price: 1750, material: "Carved Wood, Natural Pigment", region: "Rajasthan", stock: 11,
    description: "A hand-carved wooden figure finished with a distressed, antiqued paint layer that mimics generations of handling — modelled on the folk figures traditionally kept in Rajasthani havelis, popular with collectors of vintage-style Indian decor." },
  { name: "Woven Cane Mini Basket Set", category: "household", price: 480, material: "Cane, Dyed Bamboo Strip", region: "India", stock: 30,
    description: "Miniature lattice-woven baskets in dyed cane and bamboo strip, traditionally used to hold sweets or small gifts at weddings and festivals — sold as a set in an assortment of colours." },
  { name: "Rajasthani Beaded Elephant Door Hanging", category: "home-decor", price: 1100, material: "Fabric, Glass Beads, Brass Bells", region: "Rajasthan", occasion: "Festive", stock: 20,
    description: "A hanging toran-style door decoration strung with fabric elephant and camel figures, glass beads, and small brass bells — traditionally hung across doorways in Rajasthan as a festive and auspicious welcome." },
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
      update: { name: c.name },
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

    const attribution = IMAGE_ATTRIBUTION[slug];
    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.create({
      data: {
        productId: product.id,
        url: REAL_PRODUCT_IMAGES[slug] ? `/images/products/${REAL_PRODUCT_IMAGES[slug]}` : `https://picsum.photos/seed/${slug}/600/600`,
        altText: p.name,
        position: 0,
        imageCreator: attribution?.creator ?? null,
        imageLicense: attribution?.license ?? null,
        imageSourceUrl: attribution?.sourceUrl ?? null,
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
