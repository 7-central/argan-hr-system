-- Custom migration to rename inclusiveServices and add inclusiveServicesOutOfScope
-- This migration preserves all existing data in other columns

-- Step 1: Rename the existing column
ALTER TABLE "contracts"
  RENAME COLUMN "inclusive_services" TO "inclusive_services_in_scope";

-- Step 2: Add the new column for out of scope services
ALTER TABLE "contracts"
  ADD COLUMN "inclusive_services_out_of_scope" TEXT[] NOT NULL DEFAULT '{}';
