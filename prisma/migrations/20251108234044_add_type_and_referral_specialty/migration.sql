-- AlterTable: Add type column with default 'inscriere'
ALTER TABLE "requests" ADD COLUMN "type" VARCHAR(50) NOT NULL DEFAULT 'inscriere';

-- AlterTable: Add referral_specialty column (nullable, for trimitere requests)
ALTER TABLE "requests" ADD COLUMN "referral_specialty" VARCHAR(255);

-- AlterTable: Make pdf_data nullable (trimitere requests might not have PDF initially)
ALTER TABLE "requests" ALTER COLUMN "pdf_data" DROP NOT NULL;

-- AlterTable: Make signature_data_url nullable (trimitere requests might not need signature)
ALTER TABLE "requests" ALTER COLUMN "signature_data_url" DROP NOT NULL;

-- CreateIndex: Add index for type column
CREATE INDEX "idx_requests_type" ON "requests"("type");

-- Update all existing records to have type = 'inscriere' (already default, but explicit)
UPDATE "requests" SET "type" = 'inscriere' WHERE "type" IS NULL;

