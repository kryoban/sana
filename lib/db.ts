import { PrismaClient } from "@prisma/client";

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Check if DATABASE_URL or POSTGRES_URL is set
const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!databaseUrl) {
  console.error(
    "❌ DATABASE_URL or POSTGRES_URL is not set. Please set it in your .env.local file."
  );
  console.error(
    "   See MIGRATION_GUIDE.md for instructions on setting up your database."
  );
  console.error(
    "   If you're migrating from Neon, you need to set up a new database."
  );
}

// Set DATABASE_URL if only POSTGRES_URL is provided (for Prisma)
if (!process.env.DATABASE_URL && process.env.POSTGRES_URL) {
  process.env.DATABASE_URL = process.env.POSTGRES_URL;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
