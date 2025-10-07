/**
 * Script to add external audit data and second contract for XYZ Retail Group
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Finding XYZ Retail Group client...');

  // Find XYZ Retail Group client
  const client = await prisma.client.findFirst({
    where: {
      companyName: {
        contains: 'XYZ',
        mode: 'insensitive',
      },
    },
    include: {
      contracts: true,
      audits: true,
    },
  });

  if (!client) {
    console.error('❌ XYZ Retail Group client not found');
    return;
  }

  console.log(`✅ Found client: ${client.companyName} (ID: ${client.id})`);

  // Update client to mark as externally audited
  console.log('\n📝 Setting externalAudit to true...');
  await prisma.client.update({
    where: { id: client.id },
    data: { externalAudit: true },
  });
  console.log('✅ External audit flag updated');

  // Create audit records
  console.log('\n📋 Creating audit records...');

  const audit1 = await prisma.clientAudit.create({
    data: {
      clientId: client.id,
      auditedBy: 'ISO 9001 Certification Body',
      interval: 'ANNUALLY',
      nextAuditDate: new Date('2025-06-15'),
    },
  });
  console.log(`✅ Created audit 1: ${audit1.auditedBy} (Next: ${audit1.nextAuditDate})`);

  const audit2 = await prisma.clientAudit.create({
    data: {
      clientId: client.id,
      auditedBy: 'Health & Safety Executive',
      interval: 'QUARTERLY',
      nextAuditDate: new Date('2025-04-01'),
    },
  });
  console.log(`✅ Created audit 2: ${audit2.auditedBy} (Next: ${audit2.nextAuditDate})`);

  // Create second contract
  console.log('\n📄 Creating second contract...');

  // Generate contract number (increment from existing)
  const contractCount = client.contracts.length;
  const newContractNumber = `CON-1-${String(client.id).padStart(3, '0')}-${String(contractCount + 1).padStart(3, '0')}`;

  const newContract = await prisma.contract.create({
    data: {
      contractNumber: newContractNumber,
      version: contractCount + 1,
      clientId: client.id,
      contractStartDate: new Date('2024-01-01'),
      contractRenewalDate: new Date('2025-01-01'),
      status: 'ARCHIVED',
      signedContractReceived: true,
      contractUploaded: true,
      contractSentToClient: true,
      paymentTermsAgreed: true,
      inclusiveServicesInScope: ['HR Admin Support', 'Employee Support'],
      inclusiveServicesOutOfScope: [],
      hrAdminInclusiveHours: 5.0,
      employmentLawInclusiveHours: 3.0,
      hrAdminRate: 75.0,
      hrAdminRateUnit: 'HOURLY',
      employmentLawRate: 125.0,
      employmentLawRateUnit: 'HOURLY',
      mileageRate: 0.45,
      overnightRate: 100.0,
    },
  });
  console.log(`✅ Created archived contract: ${newContract.contractNumber}`);

  // Update existing contract to ACTIVE
  if (client.contracts.length > 0) {
    const existingContract = client.contracts[0];
    await prisma.contract.update({
      where: { id: existingContract.id },
      data: { status: 'ACTIVE' },
    });
    console.log(`✅ Updated existing contract to ACTIVE: ${existingContract.contractNumber}`);
  }

  // Verify final state
  console.log('\n🎉 Final State:');
  const updatedClient = await prisma.client.findUnique({
    where: { id: client.id },
    include: {
      contracts: {
        orderBy: { createdAt: 'desc' },
      },
      audits: {
        orderBy: { nextAuditDate: 'asc' },
      },
    },
  });

  console.log(`\nClient: ${updatedClient?.companyName}`);
  console.log(`External Audit: ${updatedClient?.externalAudit ? 'Yes' : 'No'}`);
  console.log(`\nAudits (${updatedClient?.audits.length}):`);
  updatedClient?.audits.forEach((audit, i) => {
    console.log(`  ${i + 1}. ${audit.auditedBy} - ${audit.interval} - Next: ${audit.nextAuditDate}`);
  });
  console.log(`\nContracts (${updatedClient?.contracts.length}):`);
  updatedClient?.contracts.forEach((contract, i) => {
    console.log(`  ${i + 1}. ${contract.contractNumber} - Status: ${contract.status}`);
  });

  console.log('\n✅ All done!');
}

main()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
