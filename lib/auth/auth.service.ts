// Authentication service for Argan HR System
// Based on document-parser database authentication patterns

import { prisma } from '@/lib/system/database';
import { verifyPassword } from './password';
import type { AdminRole } from '@prisma/client';

/**
 * Authenticated admin result
 */
export interface AuthenticatedAdmin {
  id: string;
  email: string;
  role: AdminRole;
  name: string;
  lastLogin: Date | null;
}

/**
 * Authenticate admin user with email and password
 * Returns admin data if authentication succeeds, null otherwise
 */
export async function authenticateAdmin(
  email: string,
  password: string
): Promise<AuthenticatedAdmin | null> {
  try {
    // Find admin by email (only active users)
    const admin = await prisma.admin.findUnique({
      where: {
        email,
        isActive: true, // Only active admins can authenticate
      },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        name: true,
        role: true,
        lastLogin: true,
      },
    });

    if (!admin) {
      return null;
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, admin.passwordHash);
    if (!isValidPassword) {
      return null;
    }

    // Update last login timestamp
    await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLogin: new Date() },
    });

    return {
      id: admin.id,
      email: admin.email,
      role: admin.role,
      name: admin.name,
      lastLogin: admin.lastLogin,
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

/**
 * Get admin by ID (for session validation)
 */
export async function getAdminById(id: string): Promise<AuthenticatedAdmin | null> {
  try {
    const admin = await prisma.admin.findUnique({
      where: {
        id,
        isActive: true, // Only active admins
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        lastLogin: true,
      },
    });

    return admin;
  } catch (error) {
    console.error('Get admin error:', error);
    return null;
  }
}

/**
 * Get admin by email
 */
export async function getAdminByEmail(email: string): Promise<AuthenticatedAdmin | null> {
  try {
    const admin = await prisma.admin.findUnique({
      where: {
        email,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        lastLogin: true,
      },
    });

    return admin;
  } catch (error) {
    console.error('Get admin by email error:', error);
    return null;
  }
}