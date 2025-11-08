/**
 * Script to apply the migration for adding type and referral_specialty columns
 * Run with: node scripts/apply-migration.js
 * Or: npm run db:apply-migration
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log("🔄 Applying migration: add_type_and_referral_specialty\n");

    // Add type column with default 'inscriere'
    console.log("1. Adding 'type' column...");
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "requests" 
      ADD COLUMN IF NOT EXISTS "type" VARCHAR(50) NOT NULL DEFAULT 'inscriere';
    `);

    // Add referral_specialty column (nullable)
    console.log("2. Adding 'referral_specialty' column...");
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "requests" 
      ADD COLUMN IF NOT EXISTS "referral_specialty" VARCHAR(255);
    `);

    // Make pdf_data nullable
    console.log("3. Making 'pdf_data' nullable...");
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "requests" 
        ALTER COLUMN "pdf_data" DROP NOT NULL;
      `);
    } catch (error) {
      // Column might already be nullable
      if (!error.message.includes("does not exist")) {
        console.log("   (pdf_data might already be nullable)");
      }
    }

    // Make signature_data_url nullable
    console.log("4. Making 'signature_data_url' nullable...");
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "requests" 
        ALTER COLUMN "signature_data_url" DROP NOT NULL;
      `);
    } catch (error) {
      // Column might already be nullable
      if (!error.message.includes("does not exist")) {
        console.log("   (signature_data_url might already be nullable)");
      }
    }

    // Create index for type column
    console.log("5. Creating index on 'type' column...");
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "idx_requests_type" ON "requests"("type");
    `);

    // Update all existing records to have type = 'inscriere'
    console.log("6. Updating existing records...");
    await prisma.$executeRawUnsafe(`
      UPDATE "requests" SET "type" = 'inscriere' WHERE "type" IS NULL;
    `);

    console.log("\n✅ Migration applied successfully!");
  } catch (error) {
    console.error("\n❌ Error applying migration:", error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration()
  .then(() => {
    console.log("\n✨ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Migration failed:", error);
    process.exit(1);
  });

