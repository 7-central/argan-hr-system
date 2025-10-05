-- Custom migration: Convert Client IDs from UUID to Integer
-- This migration preserves all existing data

-- Step 1: Add temporary integer ID columns
ALTER TABLE "clients" ADD COLUMN "id_new" SERIAL;
ALTER TABLE "client_contacts" ADD COLUMN "client_id_new" INTEGER;
ALTER TABLE "contracts" ADD COLUMN "client_id_new" INTEGER;

-- Step 2: Create a mapping from old UUID IDs to new integer IDs
-- The id_new column already has sequential values from SERIAL

-- Step 3: Update foreign key references in client_contacts
UPDATE "client_contacts" cc
SET "client_id_new" = c."id_new"
FROM "clients" c
WHERE cc."client_id" = c."id";

-- Step 4: Update foreign key references in contracts
UPDATE "contracts" ct
SET "client_id_new" = c."id_new"
FROM "clients" c
WHERE ct."client_id" = c."id";

-- Step 5: Drop old foreign key constraints
ALTER TABLE "client_contacts" DROP CONSTRAINT "client_contacts_client_id_fkey";
ALTER TABLE "contracts" DROP CONSTRAINT "contracts_client_id_fkey";

-- Step 6: Drop old UUID columns
ALTER TABLE "client_contacts" DROP COLUMN "client_id";
ALTER TABLE "client_contacts" DROP COLUMN "id";
ALTER TABLE "contracts" DROP COLUMN "client_id";
ALTER TABLE "contracts" DROP COLUMN "id";
ALTER TABLE "clients" DROP COLUMN "id";

-- Step 7: Rename new integer columns to original names
ALTER TABLE "clients" RENAME COLUMN "id_new" TO "id";
ALTER TABLE "client_contacts" ADD COLUMN "id" SERIAL;
ALTER TABLE "client_contacts" RENAME COLUMN "client_id_new" TO "client_id";
ALTER TABLE "contracts" ADD COLUMN "id" SERIAL;
ALTER TABLE "contracts" RENAME COLUMN "client_id_new" TO "client_id";

-- Step 8: Add primary key constraints
ALTER TABLE "clients" ADD PRIMARY KEY ("id");
ALTER TABLE "client_contacts" ADD PRIMARY KEY ("id");
ALTER TABLE "contracts" ADD PRIMARY KEY ("id");

-- Step 9: Add foreign key constraints back
ALTER TABLE "client_contacts" ADD CONSTRAINT "client_contacts_client_id_fkey"
  FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "contracts" ADD CONSTRAINT "contracts_client_id_fkey"
  FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 10: Recreate indexes on the new integer columns
CREATE INDEX "client_contacts_client_id_idx" ON "client_contacts"("client_id");
CREATE INDEX "contracts_client_id_idx" ON "contracts"("client_id");
