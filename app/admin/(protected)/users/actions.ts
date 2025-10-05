'use server';

import { revalidatePath } from 'next/cache';

import { isAppError } from '@/lib/errors';
import { withAuth } from '@/lib/server-actions/with-auth';
import { adminService } from '@/lib/services/business/admin.service';
import { canPerformAction } from '@/lib/utils/system/rbac';

import type { ServerActionResult } from '@/lib/types/action';
import type {
  CreateAdminDto,
  GetAdminsParams,
  UpdateAdminDto,
  SerializableAdminResponse,
  Admin,
} from '@/lib/types/admin';

/**
 * User Management Server Actions
 * All actions require authentication via withAuth wrapper
 * Admin user operations require SUPER_ADMIN role
 */

/**
 * Get admin users with pagination and filtering
 */
export const getUsers = withAuth(
  async (session, params?: GetAdminsParams): Promise<SerializableAdminResponse> => {
    const result = await adminService.getAdmins(params || { page: 1, limit: 25 });

    // Convert Date objects to ISO strings for client serialization
    const admins = result.admins.map((admin) => ({
      ...admin,
      createdAt: admin.createdAt.toISOString(),
      updatedAt: admin.updatedAt.toISOString(),
      lastFailedAttempt: admin.lastFailedAttempt?.toISOString() || null,
    }));

    return {
      ...result,
      admins,
    };
  }
);

/**
 * Create a new admin user
 * Requires SUPER_ADMIN or ADMIN role
 * Returns result object instead of throwing to ensure proper error serialization
 */
export const createUser = withAuth(
  async (session, data: CreateAdminDto): Promise<ServerActionResult<Admin>> => {
    // Check permissions
    if (!canPerformAction(session, 'create_admin')) {
      return {
        success: false,
        error: 'Insufficient permissions. Only SUPER_ADMIN and ADMIN can create admin users.',
      };
    }

    try {
      const admin = await adminService.createAdmin(data);

      // Revalidate the users page to show the new admin
      revalidatePath('/admin/users');

      return {
        success: true,
        data: admin,
      };
    } catch (error) {
      // Handle AppError instances (operational errors with user-friendly messages)
      if (isAppError(error)) {
        return {
          success: false,
          error: error.message, // User-friendly message from AppError
        };
      }

      // Handle unexpected errors (don't leak implementation details)
      console.error('Unexpected error in createUser:', error);
      return {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      };
    }
  }
);

/**
 * Update an admin user
 * Requires SUPER_ADMIN or ADMIN role
 * Returns result object instead of throwing to ensure proper error serialization
 */
export const updateUser = withAuth(
  async (session, id: string, data: UpdateAdminDto): Promise<ServerActionResult<Admin>> => {
    // Check permissions
    if (!canPerformAction(session, 'update_admin')) {
      return {
        success: false,
        error: 'Insufficient permissions. Only SUPER_ADMIN and ADMIN can update admin users.',
      };
    }

    try {
      const admin = await adminService.updateAdmin(id, data);

      // Revalidate the users page to show the updated admin
      revalidatePath('/admin/users');

      return {
        success: true,
        data: admin,
      };
    } catch (error) {
      // Handle AppError instances (operational errors with user-friendly messages)
      if (isAppError(error)) {
        return {
          success: false,
          error: error.message,
        };
      }

      // Handle unexpected errors
      console.error('Unexpected error in updateUser:', error);
      return {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      };
    }
  }
);

/**
 * Deactivate an admin user (soft delete)
 * Requires SUPER_ADMIN or ADMIN role
 * Returns result object instead of throwing to ensure proper error serialization
 */
export const deleteUser = withAuth(
  async (session, id: string): Promise<ServerActionResult<Admin>> => {
    // Check permissions
    if (!canPerformAction(session, 'delete_admin')) {
      return {
        success: false,
        error: 'Insufficient permissions. Only SUPER_ADMIN and ADMIN can deactivate admin users.',
      };
    }

    try {
      const admin = await adminService.deleteAdmin(id);

      // Revalidate the users page to show the deactivated admin
      revalidatePath('/admin/users');

      return {
        success: true,
        data: admin,
      };
    } catch (error) {
      // Handle AppError instances (operational errors with user-friendly messages)
      if (isAppError(error)) {
        return {
          success: false,
          error: error.message,
        };
      }

      // Handle unexpected errors
      console.error('Unexpected error in deleteUser:', error);
      return {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      };
    }
  }
);

/**
 * Reactivate a deactivated admin user
 * Requires SUPER_ADMIN or ADMIN role
 * Returns result object instead of throwing to ensure proper error serialization
 */
export const reactivateUser = withAuth(
  async (session, id: string): Promise<ServerActionResult<Admin>> => {
    // Check permissions
    if (!canPerformAction(session, 'reactivate_admin')) {
      return {
        success: false,
        error: 'Insufficient permissions. Only SUPER_ADMIN and ADMIN can reactivate admin users.',
      };
    }

    try {
      const admin = await adminService.reactivateAdmin(id);

      // Revalidate the users page to show the reactivated admin
      revalidatePath('/admin/users');

      return {
        success: true,
        data: admin,
      };
    } catch (error) {
      // Handle AppError instances (operational errors with user-friendly messages)
      if (isAppError(error)) {
        return {
          success: false,
          error: error.message,
        };
      }

      // Handle unexpected errors
      console.error('Unexpected error in reactivateUser:', error);
      return {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      };
    }
  }
);
