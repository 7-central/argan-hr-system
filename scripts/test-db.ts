import { prisma } from '@/lib/database';

async function testDatabase() {
  try {
    console.log('🔍 Testing database connection...');

    // Test 1: Database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Test 2: Count records
    const adminCount = await prisma.admin.count();
    const clientCount = await prisma.client.count();

    console.log('📊 Database Statistics:');
    console.log(`   Admins: ${adminCount}`);
    console.log(`   Clients: ${clientCount}`);

    // Test 3: Fetch sample data
    const firstAdmin = await prisma.admin.findFirst({
      select: {
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    if (firstAdmin) {
      console.log('👤 First admin:', firstAdmin);
    }

    const activeClients = await prisma.client.findMany({
      where: { status: 'ACTIVE' },
      select: {
        companyName: true,
        serviceTier: true,
        contactEmail: true,
      },
      take: 3,
    });

    console.log('🏢 Active clients:');
    activeClients.forEach((client, index) => {
      console.log(`   ${index + 1}. ${client.companyName} (${client.serviceTier})`);
    });

    console.log('🎉 Database test completed successfully!');
  } catch (error) {
    console.error('❌ Database test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
