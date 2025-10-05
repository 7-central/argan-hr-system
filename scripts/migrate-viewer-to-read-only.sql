-- Manual migration script to rename VIEWER to READ_ONLY
-- Run this directly on the database

-- Step 1: Add READ_ONLY to the enum if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname = 'AdminRole'
        AND e.enumlabel = 'READ_ONLY'
    ) THEN
        EXECUTE 'ALTER TYPE "AdminRole" ADD VALUE ''READ_ONLY''';
        RAISE NOTICE 'Added READ_ONLY value to AdminRole enum';
    ELSE
        RAISE NOTICE 'READ_ONLY value already exists in AdminRole enum';
    END IF;
END$$;

-- Step 2: Update existing VIEWER records to READ_ONLY
UPDATE "admins" SET "role" = 'READ_ONLY' WHERE "role" = 'VIEWER';

-- Step 3: Verify the update
SELECT COUNT(*) as read_only_count FROM "admins" WHERE "role" = 'READ_ONLY';
SELECT COUNT(*) as viewer_count FROM "admins" WHERE "role" = 'VIEWER';
