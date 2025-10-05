#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateViewerToReadOnly() {
  console.log('Starting migration: VIEWER → READ_ONLY');

  try {
    // Step 1: Add READ_ONLY enum value if it doesn't exist
    console.log('Step 1: Adding READ_ONLY enum value...');
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM pg_type t
              JOIN pg_enum e ON t.oid = e.enumtypid
              WHERE t.typname = 'AdminRole'
              AND e.enumlabel = 'READ_ONLY'
          ) THEN
              ALTER TYPE "AdminRole" ADD VALUE 'READ_ONLY';
              RAISE NOTICE 'Added READ_ONLY value to AdminRole enum';
          ELSE
              RAISE NOTICE 'READ_ONLY value already exists in AdminRole enum';
          END IF;
      END$$;
    `);
    console.log('✓ READ_ONLY enum value added');

    // Step 2: Wait a moment to ensure the transaction is committed
    console.log('Waiting for enum change to commit...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 3: Update existing VIEWER records to READ_ONLY
    console.log('Step 2: Updating VIEWER records to READ_ONLY...');
    const result = await prisma.$executeRawUnsafe(`
      UPDATE "admins" SET "role" = 'READ_ONLY' WHERE "role" = 'VIEWER'
    `);
    console.log(`✓ Updated ${result} records from VIEWER to READ_ONLY`);

    // Step 4: Verify the migration
    console.log('Step 3: Verifying migration...');
    const readOnlyCount = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT COUNT(*) as count FROM "admins" WHERE "role" = 'READ_ONLY'`
    );
    const viewerCount = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT COUNT(*) as count FROM "admins" WHERE "role" = 'VIEWER'`
    );

    console.log(`✓ READ_ONLY count: ${readOnlyCount[0].count}`);
    console.log(`✓ VIEWER count: ${viewerCount[0].count}`);

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateViewerToReadOnly().catch((error) => {
  console.error(error);
  process.exit(1);
});
