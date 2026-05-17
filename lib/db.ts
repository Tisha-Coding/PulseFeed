import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7 needs a driver adapter for the runtime connection.
// Next.js loads `.env` into process.env, so DATABASE_URL is available here.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

// Reuse one client across hot reloads in dev (avoids exhausting DB connections).
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
