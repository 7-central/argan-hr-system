-- AlterTable: Add version column to contracts table
-- This migration adds a version field to track contract versions per client
-- Version is calculated based on the order of contract creation for each client

-- Step 1: Add the version column with default value of 1
ALTER TABLE "contracts" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;

-- Step 2: Update existing contracts with proper version numbers
-- This uses a window function to assign version numbers based on creation order per client
WITH numbered_contracts AS (
  SELECT
    id,
    ROW_NUMBER() OVER (PARTITION BY client_id ORDER BY created_at ASC, id ASC) as version_number
  FROM "contracts"
)
UPDATE "contracts"
SET version = numbered_contracts.version_number
FROM numbered_contracts
WHERE "contracts".id = numbered_contracts.id;
