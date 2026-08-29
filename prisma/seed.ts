import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Point it at a Postgres connection string.");
}
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

async function main() {
  const [store1, store2] = await Promise.all([
    db.store.upsert({
      where: { code: "S1" },
      update: {},
      create: {
        code: "S1",
        name: "Grill Me สาขา 1",
        address: "123 ถ.สุขุมวิท กรุงเทพฯ",
        phone: "02-000-1111",
      },
    }),
    db.store.upsert({
      where: { code: "S2" },
      update: {},
      create: {
        code: "S2",
        name: "Grill Me สาขา 2",
        address: "456 ถ.พระราม 2 กรุงเทพฯ",
        phone: "02-000-2222",
      },
    }),
  ]);

  const adminPassword = await bcrypt.hash("admin1234", 10);
  const staffPassword = await bcrypt.hash("staff1234", 10);

  await db.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      name: "ผู้ดูแลระบบ",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });

  await db.user.upsert({
    where: { username: "staff1" },
    update: {},
    create: {
      username: "staff1",
      name: "พนักงานสาขา 1",
      passwordHash: staffPassword,
      role: "STAFF",
      storeId: store1.id,
    },
  });

  await db.user.upsert({
    where: { username: "staff2" },
    update: {},
    create: {
      username: "staff2",
      name: "พนักงานสาขา 2",
      passwordHash: staffPassword,
      role: "STAFF",
      storeId: store2.id,
    },
  });

  const categories = await Promise.all(
    [
      { name: "ปิ้งย่าง", slug: "grilled" },
      { name: "ข้าว-ของทานเล่น", slug: "rice-snacks" },
      { name: "น้ำจิ้ม", slug: "sauce" },
      { name: "เครื่องดื่ม", slug: "drinks" },
    ].map((c) =>
      db.category.upsert({ where: { slug: c.slug }, update: {}, create: c }),
    ),
  );
  const [grilled, riceSnacks, sauce, drinks] = categories;

  const products: {
    sku: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    stockQty: number;
    lowStockThreshold: number;
    categoryId: string;
  }[] = [
    {
      sku: "GRL-001",
      name: "หมูปิ้งไม้",
      slug: "moo-ping",
      description: "หมูปิ้งหมักสูตรต้นตำรับ ไม้ละคำ",
      price: 1000,
      stockQty: 200,
      lowStockThreshold: 30,
      categoryId: grilled.id,
    },
    {
      sku: "GRL-002",
      name: "คอหมูย่าง",
      slug: "kor-moo-yang",
      description: "คอหมูย่างนุ่ม หอมควันไฟ (ต่อ 100 กรัม)",
      price: 4500,
      stockQty: 60,
      lowStockThreshold: 10,
      categoryId: grilled.id,
    },
    {
      sku: "GRL-003",
      name: "ปีกไก่ย่าง",
      slug: "peek-gai-yang",
      description: "ปีกไก่ย่างเสียบไม้ 1 ไม้",
      price: 2500,
      stockQty: 120,
      lowStockThreshold: 20,
      categoryId: grilled.id,
    },
    {
      sku: "GRL-004",
      name: "ลูกชิ้นย่าง",
      slug: "look-chin-yang",
      description: "ลูกชิ้นหมูย่างไม้ละ 5 ลูก",
      price: 1500,
      stockQty: 150,
      lowStockThreshold: 20,
      categoryId: grilled.id,
    },
    {
      sku: "RIC-001",
      name: "ข้าวเหนียว",
      slug: "sticky-rice",
      description: "ข้าวเหนียวนึ่งร้อน ๆ (กระทงเล็ก)",
      price: 1000,
      stockQty: 100,
      lowStockThreshold: 15,
      categoryId: riceSnacks.id,
    },
    {
      sku: "SAU-001",
      name: "น้ำจิ้มแจ่ว",
      slug: "jaew",
      description: "น้ำจิ้มแจ่วรสเด็ด (ถ้วยเล็ก)",
      price: 500,
      stockQty: 80,
      lowStockThreshold: 10,
      categoryId: sauce.id,
    },
    {
      sku: "DRK-001",
      name: "น้ำเปล่า",
      slug: "water",
      description: "น้ำดื่มขวดเล็ก 500 มล.",
      price: 1000,
      stockQty: 90,
      lowStockThreshold: 12,
      categoryId: drinks.id,
    },
    {
      sku: "DRK-002",
      name: "ชาเย็น",
      slug: "thai-iced-tea",
      description: "ชาเย็นแก้วใหญ่",
      price: 2000,
      stockQty: 50,
      lowStockThreshold: 8,
      categoryId: drinks.id,
    },
  ];

  for (const p of products) {
    await db.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: p,
    });
  }

  await db.customer.upsert({
    where: { phone: "0812345678" },
    update: {},
    create: {
      name: "คุณสมชาย ใจดี",
      phone: "0812345678",
      address: "789 ถ.ลาดพร้าว กรุงเทพฯ",
    },
  });

  console.log("Seed complete.");
  console.log("Login: admin / admin1234 (ADMIN, all stores)");
  console.log("Login: staff1 / staff1234 (STAFF @ Grill Me สาขา 1)");
  console.log("Login: staff2 / staff1234 (STAFF @ Grill Me สาขา 2)");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
