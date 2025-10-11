-- Manual database fix - run this directly on the database
-- This will get the database into the correct state

BEGIN;

-- 1. Drop constraint
ALTER TABLE client_contacts DROP CONSTRAINT IF EXISTS client_contacts_client_id_type_key;

-- 2. Add description if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'client_contacts' AND column_name = 'description'
    ) THEN
        ALTER TABLE client_contacts ADD COLUMN description TEXT;
    END IF;
END $$;

-- 3. Convert type to TEXT if needed
DO $$
DECLARE
    current_type TEXT;
BEGIN
    SELECT udt_name INTO current_type
    FROM information_schema.columns
    WHERE table_name = 'client_contacts' AND column_name = 'type';

    IF current_type != 'text' THEN
        ALTER TABLE client_contacts ALTER COLUMN type TYPE TEXT;
    END IF;
END $$;

-- 4. Update data
UPDATE client_contacts
SET type = 'SERVICE'
WHERE type IN ('PRIMARY', 'SECONDARY');

-- 5. Create new enum if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ContactType_new') THEN
        CREATE TYPE "ContactType_new" AS ENUM ('SERVICE', 'INVOICE');
    END IF;
END $$;

-- 6. Convert column to new enum
ALTER TABLE client_contacts
ALTER COLUMN type TYPE "ContactType_new"
USING (type::"ContactType_new");

-- 7. Drop old enum
DROP TYPE IF EXISTS "ContactType";

-- 8. Rename enum
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ContactType_new') THEN
        ALTER TYPE "ContactType_new" RENAME TO "ContactType";
    END IF;
END $$;

COMMIT;
