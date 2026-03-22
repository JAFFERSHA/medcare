import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  // Add schema to connection string if not present
  const url = new URL(connectionString!);
  if (!url.searchParams.has("schema")) {
    url.searchParams.set("schema", "medcare");
  }

  const pool = new Pool({ connectionString: url.toString() });
  const adapter = new PrismaPg(pool, { schema: "medcare" });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
