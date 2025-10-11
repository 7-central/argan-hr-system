/**
 * Migration Script: Update Contract Numbers to New Format
 *
 * Old format: CON-{clientId}-{year}-{sequenceNumber}
 * New format: CON-{batch}-{record}
 *
 * This script:
 * 1. Fetches all contracts ordered by creation date
 * 2. Reassigns contract numbers sequentially using the new format
 * 3. Updates each contract in the database
 *
 * Run with: npx tsx scripts/migrate-contract-numbers.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateContractNumbers() {
  console.log('🔄 Starting contract number migration...\n');

  try {
    // Fetch all contracts ordered by ID (creation order)
    const contracts = await prisma.contract.findMany({
      orderBy: {
        id: 'asc', // Oldest first
      },
      select: {
        id: true,
        contractNumber: true,
        clientId: true,
      },
    });

    if (contracts.length === 0) {
      console.log('✅ No contracts found. Nothing to migrate.');
      return;
    }

    console.log(`📊 Found ${contracts.length} contracts to migrate\n`);

    // Update each contract with new numbering
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < contracts.length; i++) {
      const contract = contracts[i];
      const contractIndex = i + 1; // 1-based indexing

      // Calculate batch and record
      const batch = Math.floor(i / 999) + 1; // Batch 001, 002, etc.
      const record = (i % 999) + 1; // Record 001-999 within batch

      // Generate new contract number
      const newContractNumber = `CON-${String(batch).padStart(3, '0')}-${String(record).padStart(3, '0')}`;

      try {
        // Update the contract
        await prisma.contract.update({
          where: { id: contract.id },
          data: { contractNumber: newContractNumber },
        });

        console.log(
          `✅ [${contractIndex}/${contracts.length}] Updated Contract ID ${contract.id}: ${contract.contractNumber} → ${newContractNumber}`
        );
        successCount++;
      } catch (error) {
        console.error(
          `❌ [${contractIndex}/${contracts.length}] Failed to update Contract ID ${contract.id}:`,
          error
        );
        errorCount++;
      }
    }

    console.log('\n📈 Migration Summary:');
    console.log(`   ✅ Successfully migrated: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    console.log(`   📊 Total: ${contracts.length}`);

    if (errorCount === 0) {
      console.log('\n🎉 All contract numbers successfully migrated!');
    } else {
      console.log('\n⚠️  Some migrations failed. Please review errors above.');
    }
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateContractNumbers()
  .then(() => {
    console.log('\n✨ Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration script failed:', error);
    process.exit(1);
  });
