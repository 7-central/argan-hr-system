-- Add external audit tracking to clients

-- Step 1: Create AuditInterval enum
CREATE TYPE "AuditInterval" AS ENUM ('quarterly', 'annually', 'two_years', 'three_years', 'five_years');

-- Step 2: Add external_audit column to clients table
ALTER TABLE "clients" ADD COLUMN "external_audit" BOOLEAN NOT NULL DEFAULT false;

-- Step 3: Create client_audits table for tracking multiple auditors per client
CREATE TABLE "client_audits" (
    "id" SERIAL NOT NULL,
    "client_id" INTEGER NOT NULL,
    "audited_by" TEXT NOT NULL,
    "interval" "AuditInterval" NOT NULL,
    "next_audit_date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_audits_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "client_audits_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Step 4: Create indexes for performance
CREATE INDEX "client_audits_client_id_idx" ON "client_audits"("client_id");
CREATE INDEX "client_audits_next_audit_date_idx" ON "client_audits"("next_audit_date");
