import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Find first client with a contract
  const client = await prisma.client.findFirst({
    where: {
      contracts: {
        some: {},
      },
    },
    include: {
      contracts: {
        where: {
          status: 'ACTIVE',
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
      },
    },
  });

  if (!client || client.contracts.length === 0) {
    console.log('No client with active contract found');
    return;
  }

  console.log(`Found client: ${client.companyName} (ID: ${client.id})`);
  console.log(`Active contract: ${client.contracts[0].contractNumber}`);

  // Create archived contract (previous contract that was replaced)
  const archivedContract = await prisma.contract.create({
    data: {
      clientId: client.id,
      contractNumber: `CON-${client.id}-000-001`, // Previous contract number (older version)
      version: 1,
      status: 'ARCHIVED',
      contractStartDate: new Date('2023-01-01'),
      contractRenewalDate: new Date('2024-01-01'),
      signedContractReceived: true,
      contractUploaded: true,
      contractSentToClient: true,
      paymentTermsAgreed: true,
      hrAdminInclusiveHours: 8.0,
      employmentLawInclusiveHours: 4.0,
      inclusiveServicesInScope: ['HR Admin Support', 'Employment Law Support'],
      inclusiveServicesOutOfScope: ['Case Management'],
      hrAdminRate: 75.0,
      hrAdminRateUnit: 'HOURLY',
      employmentLawRate: 125.0,
      employmentLawRateUnit: 'HOURLY',
      mileageRate: 0.45,
      overnightRate: 100.0,
    },
  });

  console.log(`\n✅ Created archived contract: ${archivedContract.contractNumber}`);
  console.log(`   Status: ${archivedContract.status}`);
  console.log(`   Period: ${archivedContract.contractStartDate.toISOString().split('T')[0]} to ${archivedContract.contractRenewalDate.toISOString().split('T')[0]}`);
  console.log(`\nClient "${client.companyName}" now has:`);
  console.log(`   - 1 ACTIVE contract`);
  console.log(`   - 1 ARCHIVED contract`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
