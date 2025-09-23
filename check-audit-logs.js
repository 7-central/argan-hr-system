const { PrismaClient } = require('@prisma/client');

async function checkAuditLogs() {
  const prisma = new PrismaClient();
  
  try {
    console.log('=== Current Audit Logs ===');
    const auditLogs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        admin: {
          select: { email: true }
        }
      }
    });
    
    console.log(`Found ${auditLogs.length} audit log entries:`);
    auditLogs.forEach((log, index) => {
      console.log(`${index + 1}. ${log.createdAt.toISOString()} - ${log.action} on ${log.entityType}:${log.entityId} by ${log.admin?.email || 'unknown'}`);
      if (log.changes) {
        console.log(`   Changes: ${JSON.stringify(log.changes)}`);
      }
    });
    
  } catch (error) {
    console.error('Error querying audit logs:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAuditLogs();
