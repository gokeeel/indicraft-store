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

type SeedProduct = {
  name: string;
  category: string;
  price: number;
  salePrice?: number;
  material: string;
  region: string;
  occasion?: string;
  stock: number;
};

const products: SeedProduct[] = [
  { name: "Banarasi Silk Saree - Zari Border", category: "fabric", price: 6800, salePrice: 5800, material: "Silk", region: "Varanasi, UP", occasion: "Wedding", stock: 8 },
  { name: "Ikat Cotton Dupatta", category: "fabric", price: 1200, material: "Cotton", region: "Pochampally, Telangana", stock: 25 },
  { name: "Chanderi Handwoven Fabric (2m)", category: "fabric", price: 2400, material: "Chanderi Silk-Cotton", region: "Chanderi, MP", stock: 15 },
  { name: "Kalamkari Block Print Fabric", category: "fabric", price: 1600, material: "Cotton", region: "Srikalahasti, AP", stock: 20 },
  { name: "Bandhani Tie-Dye Dupatta", category: "fabric", price: 950, material: "Georgette", region: "Kutch, Gujarat", occasion: "Festive", stock: 30 },
  { name: "Jamdani Cotton Saree", category: "fabric", price: 4200, material: "Cotton", region: "West Bengal", stock: 10 },
  { name: "Ajrakh Block Print Stole", category: "fabric", price: 1100, material: "Cotton", region: "Kutch, Gujarat", stock: 22 },
  { name: "Phulkari Embroidered Dupatta", category: "fabric", price: 1800, material: "Cotton-Silk", region: "Punjab", occasion: "Wedding", stock: 12 },

  { name: "Dhokra Brass Tribal Figurine", category: "home-decor", price: 1450, material: "Brass (Dhokra)", region: "Chhattisgarh", stock: 18 },
  { name: "Madhubani Painting - Peacock", category: "home-decor", price: 2200, material: "Handmade Paper, Natural Dyes", region: "Bihar", stock: 9 },
  { name: "Blue Pottery Decorative Vase", category: "home-decor", price: 1750, salePrice: 1400, material: "Quartz Ceramic", region: "Jaipur, Rajasthan", stock: 14 },
  { name: "Warli Art Wall Hanging", category: "home-decor", price: 1300, material: "Canvas, Natural Pigment", region: "Maharashtra", stock: 16 },
  { name: "Channapatna Wooden Toy Set", category: "home-decor", price: 850, material: "Ivory Wood", region: "Channapatna, Karnataka", occasion: "Kids", stock: 24 },
  { name: "Pattachitra Hand-Painted Plate", category: "home-decor", price: 1950, material: "Palm Leaf", region: "Odisha", stock: 11 },
  { name: "Rogan Art Wall Panel", category: "home-decor", price: 3200, material: "Castor Oil Paint on Cloth", region: "Kutch, Gujarat", stock: 6 },
  { name: "Terracotta Wall Mask", category: "home-decor", price: 1050, material: "Terracotta", region: "West Bengal", stock: 20 },

  { name: "Coir Doormat - Handwoven", category: "household", price: 450, material: "Coconut Coir", region: "Kerala", stock: 40 },
  { name: "Bamboo Storage Basket Set", category: "household", price: 1100, material: "Bamboo", region: "Assam", stock: 22 },
  { name: "Sabai Grass Multipurpose Basket", category: "household", price: 700, material: "Sabai Grass", region: "Odisha", stock: 28 },
  { name: "Brass Kansa Thali Set", category: "household", price: 2600, material: "Bell Metal (Kansa)", region: "West Bengal", stock: 10 },
  { name: "Handloom Cotton Table Runner", category: "household", price: 650, material: "Cotton", region: "Tamil Nadu", stock: 30 },
  { name: "Moonj Grass Fruit Basket", category: "household", price: 550, material: "Moonj Grass", region: "Uttar Pradesh", stock: 26 },
  { name: "Copper Water Bottle - Hammered", category: "household", price: 900, material: "Copper", region: "Rajasthan", stock: 35 },

  { name: "Blue Pottery Ceramic Mug", category: "mugs", price: 550, material: "Quartz Ceramic", region: "Jaipur, Rajasthan", stock: 45 },
  { name: "Terracotta Kulhad Mug Set of 4", category: "mugs", price: 480, material: "Terracotta", region: "Uttar Pradesh", stock: 50 },
  { name: "Madhubani Hand-Painted Mug", category: "mugs", price: 650, material: "Ceramic", region: "Bihar", stock: 32 },
  { name: "Warli Art Ceramic Mug", category: "mugs", price: 600, material: "Ceramic", region: "Maharashtra", stock: 32 },
  { name: "Copper Moscow Mule Mug", category: "mugs", price: 750, salePrice: 620, material: "Copper", region: "Rajasthan", stock: 28 },

  { name: "Kashmiri Saffron (5g)", category: "spices", price: 1200, material: "Saffron", region: "Pampore, Kashmir", stock: 50 },
  { name: "Malabar Black Pepper (250g)", category: "spices", price: 380, material: "Pepper", region: "Kerala", stock: 60 },
  { name: "Kerala Green Cardamom (100g)", category: "spices", price: 650, material: "Cardamom", region: "Kerala", stock: 40 },
  { name: "Kashmiri Red Chilli Powder (200g)", category: "spices", price: 350, material: "Chilli", region: "Kashmir", stock: 55 },
  { name: "Wayanad Wild Turmeric (200g)", category: "spices", price: 420, material: "Turmeric", region: "Wayanad, Kerala", stock: 48 },
  { name: "Assam Tea Garden Cinnamon (100g)", category: "spices", price: 400, material: "Cinnamon", region: "Assam", stock: 38 },
  { name: "Rajasthani Garam Masala Blend (150g)", category: "spices", price: 390, material: "Spice Blend", region: "Rajasthan", stock: 44 },

  { name: "Handmade Jute Tote Bag", category: "uncategorized", price: 550, material: "Jute", region: "West Bengal", stock: 30 },
  { name: "Kolhapuri Leather Chappals", category: "uncategorized", price: 1400, material: "Leather", region: "Kolhapur, Maharashtra", stock: 20 },
  { name: "Meenakari Enamel Jewellery Box", category: "uncategorized", price: 1850, material: "Brass, Enamel", region: "Rajasthan", stock: 14 },
  { name: "Handcrafted Marble Coasters (Set of 6)", category: "uncategorized", price: 950, material: "Marble Inlay", region: "Agra, UP", stock: 18 },
  { name: "Naga Handwoven Shawl", category: "uncategorized", price: 2100, material: "Wool-Cotton", region: "Nagaland", occasion: "Festive", stock: 12 },
];

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
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
    const product = await prisma.product.upsert({
      where: { slug },
      update: {},
      create: {
        name: p.name,
        slug,
        description: `Handcrafted ${p.name} made from ${p.material}, sourced from artisans in ${p.region}.`,
        price: p.price,
        salePrice: p.salePrice ?? null,
        stock: p.stock,
        material: p.material,
        region: p.region,
        occasion: p.occasion ?? null,
        vendorId: vendor.id,
        categoryId: category.id,
      },
    });

    const existingImages = await prisma.productImage.count({ where: { productId: product.id } });
    if (existingImages === 0) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: `https://picsum.photos/seed/${slug}/600/600`,
          altText: p.name,
          position: 0,
        },
      });
    }
  }

  await prisma.coupon.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: { code: "WELCOME10", percentOff: 10, active: true },
  });
  await prisma.coupon.upsert({
    where: { code: "FESTIVE25" },
    update: {},
    create: { code: "FESTIVE25", percentOff: 25, active: true },
  });

  console.log(`Seeded ${categories.length} categories, ${products.length} products, and 2 coupons.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
