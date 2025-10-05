/**
 * Add third audit record with THREE_YEARS interval for XYZ Retail Group
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Finding XYZ Retail Group client...');

  const client = await prisma.client.findFirst({
    where: {
      companyName: {
        contains: 'XYZ',
        mode: 'insensitive',
      },
    },
  });

  if (!client) {
    console.error('❌ Client not found');
    return;
  }

  console.log(`✅ Found client: ${client.companyName} (ID: ${client.id})`);

  // Create third audit record with THREE_YEARS interval
  console.log('\n📋 Creating third audit record...');

  const audit = await prisma.clientAudit.create({
    data: {
      clientId: client.id,
      auditedBy: 'Industry Standards Authority',
      interval: 'THREE_YEARS',
      nextAuditDate: new Date('2027-03-15'),
    },
  });

  console.log(`✅ Created audit: ${audit.auditedBy} - ${audit.interval} - Next: ${audit.nextAuditDate}`);

  // Show all audits
  console.log('\n📊 All audits for this client:');
  const allAudits = await prisma.clientAudit.findMany({
    where: { clientId: client.id },
    orderBy: { nextAuditDate: 'asc' },
  });

  allAudits.forEach((audit, i) => {
    console.log(`  ${i + 1}. ${audit.auditedBy} - ${audit.interval} - Next: ${audit.nextAuditDate}`);
  });

  console.log('\n✅ Done!');
}

main()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
