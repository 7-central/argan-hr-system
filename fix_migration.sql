-- Manual cleanup - check and fix database state

-- Check what constraints exist
SELECT conname, contype FROM pg_constraint WHERE conrelid = 'client_contacts'::regclass;

-- Check column structure
SELECT column_name, data_type, udt_name FROM information_schema.columns WHERE table_name = 'client_contacts';

-- Check existing contact types
SELECT DISTINCT type FROM client_contacts;
