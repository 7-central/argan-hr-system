import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function updateAdminPassword() {
  try {
    // Hash the new simple password
    const hashedPassword = await bcrypt.hash('password', 12);

    // Update the admin user's password
    await prisma.admin.update({
      where: {
        email: 'admin@argan.hr',
      },
      data: {
        passwordHash: hashedPassword,
      },
    });

    console.log('✅ Password updated successfully for admin@argan.hr');
    console.log('New password: password');
  } catch (error) {
    console.error('Error updating password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminPassword();
