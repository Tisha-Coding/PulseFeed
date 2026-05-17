/**
 * Seed script — populates PostgreSQL with realistic content so the feed,
 * search and indexes can be exercised at scale.
 *
 * Run:  npm run seed           (default SEED_COUNT rows)
 *       SEED_COUNT=10000 npm run seed
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const COUNT = Number(process.env.SEED_COUNT ?? 1000);
const BATCH = 500;

function toSlug(title: string, i: number) {
  const base = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 40);
  return `${base}-${i}`; // index suffix guarantees uniqueness
}

async function main() {
  console.log(`🌱 Seeding ${COUNT} content rows...`);

  // Clean slate (engagements/progress first — they reference content).
  await prisma.engagement.deleteMany();
  await prisma.progress.deleteMany();
  await prisma.content.deleteMany();
  await prisma.user.deleteMany();

  // Demo accounts so login can be tested.
  const password = await bcrypt.hash("Password@123", 10);
  await prisma.user.createMany({
    data: [
      { email: "admin@pulsefeed.com", name: "Admin", password, role: "ADMIN" },
      { email: "user@pulsefeed.com", name: "Demo User", password, role: "USER" },
    ],
  });

  // Build content rows.
  const rows = Array.from({ length: COUNT }, (_, i) => {
    const isVideo = faker.datatype.boolean();
    const title = faker.lorem
      .sentence({ min: 4, max: 9 })
      .replace(/\.$/, "");
    return {
      title,
      slug: toSlug(title, i),
      type: isVideo ? ("VIDEO" as const) : ("ARTICLE" as const),
      description: faker.lorem.sentences({ min: 1, max: 2 }),
      thumbnailUrl: `https://picsum.photos/seed/pf${i}/640/360`,
      videoUrl: isVideo ? faker.internet.url() : null,
      articleBody: isVideo ? null : faker.lorem.paragraphs({ min: 3, max: 6 }),
      duration: isVideo ? faker.number.int({ min: 120, max: 3600 }) : null,
      readTime: isVideo ? null : faker.number.int({ min: 2, max: 20 }),
      viewCount: faker.number.int({ min: 0, max: 500_000 }),
      likeCount: faker.number.int({ min: 0, max: 40_000 }),
      bookmarkCount: faker.number.int({ min: 0, max: 8_000 }),
    };
  });

  // Batched inserts keep memory and the connection happy.
  for (let i = 0; i < rows.length; i += BATCH) {
    await prisma.content.createMany({ data: rows.slice(i, i + BATCH) });
    console.log(`  inserted ${Math.min(i + BATCH, rows.length)}/${COUNT}`);
  }

  console.log("✅ Seed complete.");
  console.log("   Login: admin@pulsefeed.com / user@pulsefeed.com  ·  Password@123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
