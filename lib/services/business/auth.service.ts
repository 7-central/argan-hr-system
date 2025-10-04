// Authentication service for Argan HR System
// Based on document-parser database authentication patterns

import { getDatabaseInstance } from '@/lib/database';
import { verifyPassword } from '@/lib/utils/system/password';

import type { AdminRole, PrismaClient } from '@prisma/client';

/**
 * Authenticated admin result
 */
export interface AuthenticatedAdmin {
  id: string;
  email: string;
  role: AdminRole;
  name: string;
}

/**
 * AuthService - Business logic for authentication
 *
 * Key patterns:
 * - Constructor dependency injection for database access
 * - Consistent with ClientService and DashboardService patterns
 * - Following document-parser authentication patterns
 */
export class AuthService {
  constructor(private readonly db: PrismaClient) {}

  /**
   * Authenticate admin user with email and password
   * Returns admin data if authentication succeeds, null otherwise
   */
  async authenticateAdmin(email: string, password: string): Promise<AuthenticatedAdmin | null> {
    try {
      // Find admin by email (only active users)
      const admin = await this.db.admin.findUnique({
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

      return {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        name: admin.name,
      };
    } catch (error) {
      console.error('Authentication error:', error);
      return null;
    }
  }

  /**
   * Get admin by ID (for session validation)
   */
  async getAdminById(id: string): Promise<AuthenticatedAdmin | null> {
    try {
      const admin = await this.db.admin.findUnique({
        where: {
          id,
          isActive: true, // Only active admins
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
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
  async getAdminByEmail(email: string): Promise<AuthenticatedAdmin | null> {
    try {
      const admin = await this.db.admin.findUnique({
        where: {
          email,
          isActive: true,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });

      return admin;
    } catch (error) {
      console.error('Get admin by email error:', error);
      return null;
    }
  }
}

// Singleton instance export with environment-specific database
export const authService = new AuthService(getDatabaseInstance());
