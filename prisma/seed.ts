import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create super admin user
  const hashedPassword = await bcrypt.hash('ChangeMe123!', 12);

  const superAdmin = await prisma.admin.upsert({
    where: { email: 'admin@argan.hr' },
    update: {},
    create: {
      email: 'admin@argan.hr',
      passwordHash: hashedPassword,
      name: 'System Administrator',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  console.log('✅ Created super admin:', superAdmin.email);

  // Create sample clients for development
  const sampleClients = [
    {
      companyName: 'ABC Manufacturing Ltd',
      sector: 'Manufacturing',
      serviceTier: 'TIER_1' as const,
      monthlyRetainer: 1500,
      contractStartDate: new Date('2024-01-01'),
      contractRenewalDate: new Date('2025-01-01'),
      status: 'ACTIVE' as const,
      createdBy: superAdmin.id,
    },
    {
      companyName: 'XYZ Retail Group',
      sector: 'Retail',
      serviceTier: 'DOC_ONLY' as const,
      monthlyRetainer: 500,
      contractStartDate: new Date('2024-03-01'),
      contractRenewalDate: new Date('2025-03-01'),
      status: 'ACTIVE' as const,
      createdBy: superAdmin.id,
    },
    {
      companyName: 'Premier Care Services',
      sector: 'Healthcare',
      serviceTier: 'AD_HOC' as const,
      monthlyRetainer: null,
      contractStartDate: new Date('2024-06-01'),
      contractRenewalDate: new Date('2025-06-01'),
      status: 'PENDING' as const,
      createdBy: superAdmin.id,
    },
  ];

  for (const clientData of sampleClients) {
    // Check if client already exists by company name
    const existingClient = await prisma.client.findFirst({
      where: { companyName: clientData.companyName },
    });

    if (!existingClient) {
      const client = await prisma.client.create({
        data: clientData,
      });
      console.log('✅ Created client:', client.companyName);
    } else {
      console.log('⏭️ Client already exists:', existingClient.companyName);
    }
  }

  console.log('🎉 Seed completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
