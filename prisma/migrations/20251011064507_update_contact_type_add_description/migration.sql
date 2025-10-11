-- Update ContactType enum and add description field to ClientContact
-- Data-preserving migration: PRIMARY and SECONDARY → SERVICE
-- Idempotent: safe to run multiple times

-- Step 1: Drop the unique constraint FIRST (critical - allows PRIMARY/SECONDARY -> SERVICE conversion)
ALTER TABLE "client_contacts" DROP CONSTRAINT IF EXISTS "client_contacts_client_id_type_key";

-- Step 2: Add description column (nullable) - only if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'client_contacts' AND column_name = 'description') THEN
        ALTER TABLE "client_contacts" ADD COLUMN "description" TEXT;
    END IF;
END $$;

-- Step 3: Convert type column to TEXT temporarily (only if not already TEXT)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'client_contacts' AND column_name = 'type'
               AND udt_name != 'text') THEN
        ALTER TABLE "client_contacts" ALTER COLUMN "type" TYPE TEXT;
    END IF;
END $$;

-- Step 4: Update existing data - Convert PRIMARY and SECONDARY to SERVICE
UPDATE "client_contacts"
SET "type" = 'SERVICE'
WHERE "type" IN ('PRIMARY', 'SECONDARY');

-- Step 5: Create new enum with SERVICE and INVOICE only (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ContactType_new') THEN
        CREATE TYPE "ContactType_new" AS ENUM ('SERVICE', 'INVOICE');
    END IF;
END $$;

-- Step 6: Change column type to new enum
ALTER TABLE "client_contacts"
ALTER COLUMN "type" TYPE "ContactType_new"
USING ("type"::"ContactType_new");

-- Step 7: Drop old enum (if it exists and is not in use)
DROP TYPE IF EXISTS "ContactType";

-- Step 8: Rename new enum to original name (if not already renamed)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ContactType_new') THEN
        ALTER TYPE "ContactType_new" RENAME TO "ContactType";
    END IF;
END $$;
