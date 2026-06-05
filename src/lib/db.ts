import { PrismaClient } from "@prisma/client";
import { join } from "path";

// Ensure db directory exists
const dbDir = join(process.cwd(), "db");
try {
  const fs = require("fs");
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
} catch {
  // ignore
}

// Build DATABASE_URL if not set
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:" + join(dbDir, "custom.db");
}

// Standard Prisma singleton — simple and reliable
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
