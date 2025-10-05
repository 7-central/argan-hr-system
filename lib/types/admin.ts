import type { AdminRole as PrismaAdminRole } from '@prisma/client';

/**
 * Re-export AdminRole enum for app layer use
 * App layer should import from here, not directly from @prisma/client
 */
export type AdminRole = PrismaAdminRole;
export { AdminRole as AdminRoleEnum } from '@prisma/client';

/**
 * Admin user type for client-side use
 */
export interface Admin {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  failedLoginAttempts?: number;
  lastFailedAttempt?: Date | null;
  lockedUntil?: Date | null;
}

/**
 * DTO for creating a new admin user
 */
export interface CreateAdminDto {
  email: string;
  name: string;
  password: string;
  role: AdminRole;
}

/**
 * DTO for updating an admin user
 */
export interface UpdateAdminDto {
  email?: string;
  name?: string;
  password?: string; // Optional - only if changing password
  role?: AdminRole;
  isActive?: boolean;
}

/**
 * Query parameters for getting admin users
 */
export interface GetAdminsParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: AdminRole;
  isActive?: boolean;
}

/**
 * Paginated admin response
 */
export interface AdminResponse {
  admins: Admin[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Serializable admin response (for Server Actions)
 * Converts Date objects to ISO strings for client serialization
 */
export interface SerializableAdmin extends Omit<Admin, 'createdAt' | 'updatedAt' | 'lastFailedAttempt'> {
  createdAt: string;
  updatedAt: string;
  lastFailedAttempt?: string | null;
}

export interface SerializableAdminResponse {
  admins: SerializableAdmin[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
