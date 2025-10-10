-- CreateEnum: Add ClientType enum
CREATE TYPE "ClientType" AS ENUM ('company', 'individual');

-- AlterTable: Add client_type column with default value to preserve existing data
ALTER TABLE "clients" ADD COLUMN "client_type" "ClientType" NOT NULL DEFAULT 'company';

-- Update existing records to ensure they have the company value (redundant due to default, but explicit)
UPDATE "clients" SET "client_type" = 'company' WHERE "client_type" IS NULL;
