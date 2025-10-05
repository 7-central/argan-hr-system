-- Custom migration: Add document numbers to contracts and create new tables
-- This migration preserves all existing data

-- Step 1: Add new columns to contracts table
ALTER TABLE "contracts" ADD COLUMN "contract_number" VARCHAR(255);
ALTER TABLE "contracts" ADD COLUMN "doc_url" TEXT;

-- Step 2: Generate contract numbers for existing records
-- Format: CON-{batch}-{clientId}-{contractCount}
-- Batch calculation: (clientId - 1) / 999 + 1
-- Client position: ((clientId - 1) % 999) + 1
DO $$
DECLARE
    contract_record RECORD;
    batch_num INTEGER;
    client_position INTEGER;
    contract_count INTEGER;
    contract_num VARCHAR(255);
BEGIN
    FOR contract_record IN
        SELECT
            id,
            client_id,
            ROW_NUMBER() OVER (PARTITION BY client_id ORDER BY id) as row_num
        FROM "contracts"
        ORDER BY id
    LOOP
        -- Calculate batch number (1 for clients 1-999, 2 for 1000-1998, etc.)
        batch_num := ((contract_record.client_id - 1) / 999) + 1;

        -- Calculate position within batch (1-999)
        client_position := ((contract_record.client_id - 1) % 999) + 1;

        -- Contract count for this client
        contract_count := contract_record.row_num;

        -- Generate contract number: CON-{batch}-{clientPosition}-{contractCount}
        contract_num := 'CON-' ||
                       batch_num || '-' ||
                       LPAD(client_position::TEXT, 3, '0') || '-' ||
                       LPAD(contract_count::TEXT, 3, '0');

        -- Update the contract with the generated number
        UPDATE "contracts"
        SET "contract_number" = contract_num
        WHERE id = contract_record.id;
    END LOOP;
END $$;

-- Step 3: Make contract_number NOT NULL and UNIQUE after populating
ALTER TABLE "contracts" ALTER COLUMN "contract_number" SET NOT NULL;
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_contract_number_key" UNIQUE ("contract_number");

-- Step 4: Rename contractStatus to status (column rename at DB level)
ALTER TABLE "contracts" RENAME COLUMN "contract_status" TO "status";

-- Step 5: Drop old index on contract_status and create new one on status
DROP INDEX IF EXISTS "contracts_contract_status_idx";
CREATE INDEX "contracts_status_idx" ON "contracts"("status");

-- Step 6: Add index on contract_number for faster lookups
CREATE INDEX "contracts_contract_number_idx" ON "contracts"("contract_number");

-- Step 7: Create policies table
CREATE TABLE "policies" (
    "id" SERIAL NOT NULL,
    "policy_number" VARCHAR(255) NOT NULL,
    "client_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "policies_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "policies_policy_number_key" UNIQUE ("policy_number"),
    CONSTRAINT "policies_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "policies_client_id_idx" ON "policies"("client_id");
CREATE INDEX "policies_policy_number_idx" ON "policies"("policy_number");

-- Step 8: Create handbooks table
CREATE TABLE "handbooks" (
    "id" SERIAL NOT NULL,
    "handbook_number" VARCHAR(255) NOT NULL,
    "client_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "handbooks_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "handbooks_handbook_number_key" UNIQUE ("handbook_number"),
    CONSTRAINT "handbooks_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "handbooks_client_id_idx" ON "handbooks"("client_id");
CREATE INDEX "handbooks_handbook_number_idx" ON "handbooks"("handbook_number");

-- Step 9: Create internals table
CREATE TABLE "internals" (
    "id" SERIAL NOT NULL,
    "internal_number" VARCHAR(255) NOT NULL,
    "client_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "internals_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "internals_internal_number_key" UNIQUE ("internal_number"),
    CONSTRAINT "internals_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "internals_client_id_idx" ON "internals"("client_id");
CREATE INDEX "internals_internal_number_idx" ON "internals"("internal_number");

-- Step 10: Create archives table
CREATE TABLE "archives" (
    "id" SERIAL NOT NULL,
    "archive_number" VARCHAR(255) NOT NULL,
    "client_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "archives_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "archives_archive_number_key" UNIQUE ("archive_number"),
    CONSTRAINT "archives_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "archives_client_id_idx" ON "archives"("client_id");
CREATE INDEX "archives_archive_number_idx" ON "archives"("archive_number");
