-- CreateTable
CREATE TABLE "requests" (
    "id" SERIAL NOT NULL,
    "patient_name" VARCHAR(255) NOT NULL,
    "patient_cnp" VARCHAR(13) NOT NULL,
    "patient_birth_date" VARCHAR(10) NOT NULL,
    "patient_citizenship" VARCHAR(100) NOT NULL,
    "patient_address_street" VARCHAR(255) NOT NULL,
    "patient_address_number" VARCHAR(50),
    "patient_address_block" VARCHAR(50),
    "patient_address_entrance" VARCHAR(50),
    "patient_address_apartment" VARCHAR(50),
    "patient_address_sector" VARCHAR(100) NOT NULL,
    "patient_id_type" VARCHAR(100) NOT NULL,
    "patient_id_series" VARCHAR(50) NOT NULL,
    "patient_id_number" VARCHAR(50) NOT NULL,
    "patient_id_issued_by" VARCHAR(255) NOT NULL,
    "patient_id_issue_date" VARCHAR(10) NOT NULL,
    "doctor_name" VARCHAR(255) NOT NULL,
    "doctor_specialty" VARCHAR(255),
    "pdf_data" BYTEA NOT NULL,
    "signature_data_url" TEXT NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_requests_cnp" ON "requests"("patient_cnp");

-- CreateIndex
CREATE INDEX "idx_requests_status" ON "requests"("status");

-- CreateIndex
CREATE INDEX "idx_requests_created_at" ON "requests"("created_at" DESC);

