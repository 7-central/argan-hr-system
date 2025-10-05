-- Update existing VIEWER records to READ_ONLY

UPDATE "admins" SET "role" = 'READ_ONLY' WHERE "role" = 'VIEWER';
