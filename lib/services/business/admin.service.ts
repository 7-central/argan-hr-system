import { Admin, PrismaClient } from '@prisma/client';

import { getDatabaseInstance } from '@/lib/database';
import {
  ValidationError,
  FieldValidationError,
  AdminNotFoundError,
  EmailAlreadyExistsError,
} from '@/lib/errors';
import { hashPassword, validatePasswordStrength } from '@/lib/utils/system/password';

import type {
  GetAdminsParams,
  CreateAdminDto,
  UpdateAdminDto,
  AdminResponse,
} from '@/lib/types/admin';

/**
 * AdminService - Business logic for admin user management
 *
 * Key patterns:
 * - Constructor dependency injection for database access
 * - Proper error handling with business errors
 * - Input validation
 * - Password hashing and strength validation
 * - Role-based access control
 */
export class AdminService {
  constructor(private readonly db: PrismaClient) {}

  /**
   * Get all active admin users (simple list for dropdowns)
   */
  async getActiveAdminUsers(): Promise<Array<{ id: string; name: string; email: string }>> {
    const admins = await this.db.admin.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return admins;
  }

  /**
   * Get admin users with search and pagination
   */
  async getAdmins(params: GetAdminsParams): Promise<AdminResponse> {
    const { page = 1, limit = 25, search = '', role, isActive } = params;

    // Validate pagination parameters
    if (page < 1) {
      throw new ValidationError('Page must be greater than 0');
    }
    if (limit < 1 || limit > 100) {
      throw new ValidationError('Limit must be between 1 and 100');
    }

    const offset = (page - 1) * limit;

    // Build search conditions
    const where: {
      OR?: Array<{ email: { contains: string; mode: 'insensitive' } } | { name: { contains: string; mode: 'insensitive' } }>;
      role?: typeof role;
      isActive?: boolean;
    } = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' as const } },
        { name: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    if (role !== undefined) {
      where.role = role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Use transaction for consistency
    const [admins, totalCount] = await this.db.$transaction([
      this.db.admin.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          failedLoginAttempts: true,
          lastFailedAttempt: true,
          lockedUntil: true,
        },
      }),
      this.db.admin.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      admins,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get an admin user by ID
   */
  async getAdminById(id: string): Promise<Admin> {
    // Validate ID format
    if (!id || id.length < 10) {
      throw new ValidationError('Invalid admin ID format');
    }

    const admin = await this.db.admin.findUnique({
      where: { id },
    });

    if (!admin) {
      throw new AdminNotFoundError(id);
    }

    return admin;
  }

  /**
   * Create a new admin user
   */
  async createAdmin(data: CreateAdminDto): Promise<Admin> {
    // Validate required fields
    const errors = [];

    if (!data.name) {
      errors.push({ field: 'name', message: 'Name is required' });
    }

    if (!data.email) {
      errors.push({ field: 'email', message: 'Email is required' });
    } else if (!this.isValidEmail(data.email)) {
      errors.push({ field: 'email', message: 'Invalid email format' });
    }

    if (!data.password) {
      errors.push({ field: 'password', message: 'Password is required' });
    } else if (!validatePasswordStrength(data.password)) {
      errors.push({
        field: 'password',
        message: 'Password must be at least 8 characters with uppercase, lowercase, and number',
      });
    }

    if (!data.role) {
      errors.push({ field: 'role', message: 'Role is required' });
    }

    if (errors.length > 0) {
      throw new FieldValidationError(errors);
    }

    // Check for duplicate email
    await this.checkDuplicateEmail(data.email);

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Create admin
    const admin = await this.db.admin.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: data.role,
        isActive: true,
      },
    });

    return admin;
  }

  /**
   * Update an admin user
   */
  async updateAdmin(id: string, data: UpdateAdminDto): Promise<Admin> {
    // Validate ID format
    if (!id || id.length < 10) {
      throw new ValidationError('Invalid admin ID format');
    }

    // Check if admin exists
    const existingAdmin = await this.db.admin.findUnique({
      where: { id },
    });

    if (!existingAdmin) {
      throw new AdminNotFoundError(id);
    }

    // Validate fields if provided
    const errors = [];

    if (data.name !== undefined && !data.name) {
      errors.push({ field: 'name', message: 'Name cannot be empty' });
    }

    if (data.email !== undefined) {
      if (!data.email) {
        errors.push({ field: 'email', message: 'Email cannot be empty' });
      } else if (!this.isValidEmail(data.email)) {
        errors.push({ field: 'email', message: 'Invalid email format' });
      }
    }

    if (data.password !== undefined && data.password) {
      if (!validatePasswordStrength(data.password)) {
        errors.push({
          field: 'password',
          message: 'Password must be at least 8 characters with uppercase, lowercase, and number',
        });
      }
    }

    if (errors.length > 0) {
      throw new FieldValidationError(errors);
    }

    // Check for duplicate email if email is being changed
    if (data.email && data.email !== existingAdmin.email) {
      await this.checkDuplicateEmail(data.email, id);
    }

    // Prepare update data
    const updateData: {
      name?: string;
      email?: string;
      passwordHash?: string;
      role?: typeof data.role;
      isActive?: boolean;
    } = {};

    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email;
    if (data.role) updateData.role = data.role;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    // Hash new password if provided
    if (data.password && data.password.trim()) {
      updateData.passwordHash = await hashPassword(data.password);
    }

    // Update admin
    const admin = await this.db.admin.update({
      where: { id },
      data: updateData,
    });

    return admin;
  }

  /**
   * Soft delete an admin user (set isActive to false)
   */
  async deleteAdmin(id: string): Promise<Admin> {
    // Validate ID format
    if (!id || id.length < 10) {
      throw new ValidationError('Invalid admin ID format');
    }

    // Check if admin exists
    const existingAdmin = await this.db.admin.findUnique({
      where: { id },
    });

    if (!existingAdmin) {
      throw new AdminNotFoundError(id);
    }

    // Soft delete by setting isActive to false
    const admin = await this.db.admin.update({
      where: { id },
      data: {
        isActive: false,
      },
    });

    return admin;
  }

  /**
   * Reactivate a deactivated admin user
   */
  async reactivateAdmin(id: string): Promise<Admin> {
    // Validate ID format
    if (!id || id.length < 10) {
      throw new ValidationError('Invalid admin ID format');
    }

    // Check if admin exists
    const existingAdmin = await this.db.admin.findUnique({
      where: { id },
    });

    if (!existingAdmin) {
      throw new AdminNotFoundError(id);
    }

    // Reactivate by setting isActive to true
    const admin = await this.db.admin.update({
      where: { id },
      data: {
        isActive: true,
      },
    });

    return admin;
  }

  /**
   * Private helper: Validate email format
   */
  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /**
   * Private helper: Check for duplicate email
   */
  private async checkDuplicateEmail(email: string, excludeId?: string): Promise<void> {
    const existingAdmin = await this.db.admin.findFirst({
      where: {
        email,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });

    if (existingAdmin) {
      throw new EmailAlreadyExistsError(email);
    }
  }
}

// Singleton instance export with environment-specific database
export const adminService = new AdminService(getDatabaseInstance());
