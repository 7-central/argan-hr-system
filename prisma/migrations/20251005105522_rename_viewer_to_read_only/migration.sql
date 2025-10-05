-- Rename VIEWER role to READ_ONLY in AdminRole enum

-- Step 1: Add new READ_ONLY value to enum (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t
                   JOIN pg_enum e ON t.oid = e.enumtypid
                   WHERE t.typname = 'AdminRole'
                   AND e.enumlabel = 'READ_ONLY') THEN
        ALTER TYPE "AdminRole" ADD VALUE 'READ_ONLY';
    END IF;
END$$;
