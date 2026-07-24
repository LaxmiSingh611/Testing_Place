import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function placeholderImage(seed: string, i: number) {
  return `https://picsum.photos/seed/${seed}-${i}/800/800`;
}

async function upsertCategory(name: string, parentId: string | null = null) {
  const slug = slugify(name);
  return prisma.category.upsert({
    where: { slug },
    update: { name, parentId },
    create: { name, slug, parentId },
  });
}

const CATALOG: Array<{
  category: string;
  products: Array<{ title: string; price: number; compareAtPrice?: number; stock: number }>;
}> = [
  {
    category: "Mobiles",
    products: [
      { title: "Aurora X12 Smartphone (128GB)", price: 18999, compareAtPrice: 21999, stock: 42 },
      { title: "Nimbus Pro 5G Phone (256GB)", price: 27999, stock: 18 },
      { title: "Pixel Lite Budget Phone (64GB)", price: 9999, compareAtPrice: 11499, stock: 60 },
      { title: "Zenith Fold Flagship Phone", price: 89999, stock: 5 },
    ],
  },
  {
    category: "Laptops",
    products: [
      { title: "Vector 14 Ultrabook (i5, 16GB)", price: 54999, compareAtPrice: 61999, stock: 15 },
      { title: "Forge 15 Gaming Laptop (RTX)", price: 112999, stock: 7 },
      { title: "Slate Air Thin & Light Laptop", price: 47999, stock: 0 },
    ],
  },
  {
    category: "Men's Clothing",
    products: [
      { title: "Classic Fit Cotton Shirt", price: 899, compareAtPrice: 1299, stock: 120 },
      { title: "Slim Fit Denim Jeans", price: 1499, stock: 85 },
      { title: "Everyday Crew Neck T-Shirt (Pack of 3)", price: 699, stock: 200 },
    ],
  },
  {
    category: "Women's Clothing",
    products: [
      { title: "Floral Print Summer Dress", price: 1299, compareAtPrice: 1799, stock: 64 },
      { title: "High-Waist Yoga Leggings", price: 899, stock: 150 },
      { title: "Wool Blend Winter Coat", price: 3499, stock: 22 },
    ],
  },
  {
    category: "Home & Kitchen",
    products: [
      { title: "Stainless Steel 5L Pressure Cooker", price: 2499, stock: 40 },
      { title: "Non-Stick Cookware Set (5 Pieces)", price: 3299, compareAtPrice: 3999, stock: 30 },
      { title: "Robotic Vacuum Cleaner", price: 14999, stock: 12 },
    ],
  },
  {
    category: "Books",
    products: [
      { title: "The Midnight Ledger — a novel", price: 399, stock: 75 },
      { title: "Atomic Focus: Deep Work for Modern Life", price: 549, compareAtPrice: 699, stock: 90 },
    ],
  },
];

async function main() {
  const adminPasswordHash = await bcrypt.hash("Admin@12345", 10);
  const userPasswordHash = await bcrypt.hash("User@12345", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@bazaar.test" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@bazaar.test",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
    },
  });

  const user = await prisma.user.upsert({
    where: { email: "user@bazaar.test" },
    update: {},
    create: {
      name: "Test Shopper",
      email: "user@bazaar.test",
      passwordHash: userPasswordHash,
      role: "USER",
    },
  });

  await prisma.cart.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });
  await prisma.cart.upsert({
    where: { userId: admin.id },
    update: {},
    create: { userId: admin.id },
  });

  const electronics = await upsertCategory("Electronics");
  const fashion = await upsertCategory("Fashion");
  await upsertCategory("Home & Kitchen");
  await upsertCategory("Books");

  const mobiles = await upsertCategory("Mobiles", electronics.id);
  const laptops = await upsertCategory("Laptops", electronics.id);
  const mensClothing = await upsertCategory("Men's Clothing", fashion.id);
  const womensClothing = await upsertCategory("Women's Clothing", fashion.id);

  const categoryByName: Record<string, string> = {
    Mobiles: mobiles.id,
    Laptops: laptops.id,
    "Men's Clothing": mensClothing.id,
    "Women's Clothing": womensClothing.id,
    "Home & Kitchen": (await upsertCategory("Home & Kitchen")).id,
    Books: (await upsertCategory("Books")).id,
  };

  let productCount = 0;
  for (const group of CATALOG) {
    const categoryId = categoryByName[group.category];
    for (const p of group.products) {
      const slug = slugify(p.title);
      const product = await prisma.product.upsert({
        where: { slug },
        update: {
          price: p.price,
          compareAtPrice: p.compareAtPrice ?? null,
          stock: p.stock,
          categoryId,
        },
        create: {
          title: p.title,
          slug,
          description: `${p.title} — a great pick from our ${group.category} collection. Quality checked and ready to ship.`,
          price: p.price,
          compareAtPrice: p.compareAtPrice ?? null,
          stock: p.stock,
          categoryId,
        },
      });

      const existingImages = await prisma.productImage.count({ where: { productId: product.id } });
      if (existingImages === 0) {
        await prisma.productImage.createMany({
          data: [0, 1].map((i) => ({
            productId: product.id,
            url: placeholderImage(slug, i),
            position: i,
          })),
        });
      }
      productCount += 1;
    }
  }

  const address = await prisma.address.upsert({
    where: { id: "seed-demo-address" },
    update: {},
    create: {
      id: "seed-demo-address",
      userId: user.id,
      fullName: "Test Shopper",
      phone: "9876543210",
      line1: "221B Baker Street",
      city: "Mumbai",
      state: "Maharashtra",
      postalCode: "400001",
      country: "IN",
      isDefault: true,
    },
  });

  const seedProducts = await prisma.product.findMany({ take: 5, orderBy: { createdAt: "asc" } });

  const DEMO_ORDERS: Array<{
    status: "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED";
    paymentStatus: "PENDING" | "PROCESSING" | "SUCCEEDED" | "FAILED" | "REFUNDED";
  }> = [
    { status: "PENDING", paymentStatus: "PENDING" },
    { status: "CONFIRMED", paymentStatus: "SUCCEEDED" },
    { status: "PROCESSING", paymentStatus: "SUCCEEDED" },
    { status: "SHIPPED", paymentStatus: "SUCCEEDED" },
    { status: "DELIVERED", paymentStatus: "SUCCEEDED" },
    { status: "CANCELLED", paymentStatus: "FAILED" },
    { status: "REFUNDED", paymentStatus: "REFUNDED" },
  ];

  let orderCount = 0;
  for (const [index, demo] of DEMO_ORDERS.entries()) {
    const orderNumber = `ORD-DEMO-${demo.status}`;
    const existing = await prisma.order.findUnique({ where: { orderNumber } });
    if (existing) continue;

    const product = seedProducts[index % seedProducts.length];
    const quantity = 1 + (index % 2);
    const subtotal = Number(product.price) * quantity;
    const shippingFee = subtotal >= 999 ? 0 : 49;
    const total = subtotal + shippingFee;

    await prisma.order.create({
      data: {
        orderNumber,
        userId: user.id,
        status: demo.status,
        subtotal,
        shippingFee,
        tax: 0,
        total,
        shippingAddressId: address.id,
        billingAddressId: address.id,
        items: {
          create: {
            productId: product.id,
            titleSnapshot: product.title,
            priceSnapshot: product.price,
            quantity,
          },
        },
        payment: {
          create: {
            method: "MOCK_CARD",
            status: demo.paymentStatus,
            amount: total,
            processedAt: demo.paymentStatus === "PENDING" ? null : new Date(),
            failureReason: demo.paymentStatus === "FAILED" ? "Payment declined by mock gateway." : null,
          },
        },
      },
    });
    orderCount += 1;
  }

  const REVIEWS: Array<{ productSlug: string; userId: string; rating: number; title: string; body: string }> = [
    {
      productSlug: "aurora-x12-smartphone-128gb",
      userId: user.id,
      rating: 5,
      title: "Great value phone",
      body: "Camera quality is excellent for the price. Battery easily lasts a full day.",
    },
    {
      productSlug: "aurora-x12-smartphone-128gb",
      userId: admin.id,
      rating: 4,
      title: "Solid daily driver",
      body: "Fast performance, though it gets a little warm while gaming.",
    },
    {
      productSlug: "vector-14-ultrabook-i5-16gb",
      userId: user.id,
      rating: 5,
      title: "Perfect for work",
      body: "Lightweight, great keyboard, and the battery life is excellent for travel.",
    },
  ];

  let reviewCount = 0;
  for (const review of REVIEWS) {
    const product = await prisma.product.findUnique({ where: { slug: review.productSlug } });
    if (!product) continue;
    await prisma.review.upsert({
      where: { productId_userId: { productId: product.id, userId: review.userId } },
      update: {},
      create: {
        productId: product.id,
        userId: review.userId,
        rating: review.rating,
        title: review.title,
        body: review.body,
      },
    });
    reviewCount += 1;
  }

  console.log(
    `Seeded: 2 users (admin@bazaar.test / user@bazaar.test, password pattern Role@12345), ` +
      `6 categories, ${productCount} products, 1 address, ${orderCount} demo orders, ${reviewCount} reviews.`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
