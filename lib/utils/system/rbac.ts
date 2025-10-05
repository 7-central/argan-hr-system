// Role-based access control for Argan HR System
// Based on document-parser RBAC patterns

import { NextRequest, NextResponse } from 'next/server';

import { AdminRoleEnum } from '@/lib/types/admin';
import { validateSession } from '@/lib/utils/system/session';

import type { AdminRole } from '@/lib/types/admin';
import type { AdminSession } from '@/lib/types/auth';

/**
 * Enhanced request with admin session
 */
export interface AuthenticatedRequest extends NextRequest {
  adminSession: AdminSession;
}

/**
 * Role hierarchy for permission checking
 * SUPER_ADMIN has all permissions
 * ADMIN has most permissions
 * READ_ONLY has read-only permissions
 */
const ROLE_HIERARCHY = {
  [AdminRoleEnum.SUPER_ADMIN]: 3,
  [AdminRoleEnum.ADMIN]: 2,
  [AdminRoleEnum.READ_ONLY]: 1,
};

/**
 * Check if user role has sufficient permissions
 */
function hasRole(userRole: AdminRole, requiredRoles: AdminRole[]): boolean {
  return requiredRoles.some((role) => ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[role]);
}

/**
 * Require specific roles for route access
 */
export function requireRole(allowedRoles: AdminRole[]) {
  return async function (request: NextRequest): Promise<NextResponse | null> {
    const session = await validateSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    if (!hasRole(session.role, allowedRoles)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden - Insufficient permissions',
          required: allowedRoles,
          current: session.role,
        },
        { status: 403 }
      );
    }

    // Add session to request for downstream handlers
    (request as AuthenticatedRequest).adminSession = session;
    return null;
  };
}

/**
 * Require SUPER_ADMIN role
 */
export const requireSuperAdmin = () => requireRole([AdminRoleEnum.SUPER_ADMIN]);

/**
 * Require ADMIN or higher role
 */
export const requireAdmin = () => requireRole([AdminRoleEnum.SUPER_ADMIN, AdminRoleEnum.ADMIN]);

/**
 * Require any authenticated user (READ_ONLY or higher)
 */
export const requireReadOnly = () =>
  requireRole([AdminRoleEnum.SUPER_ADMIN, AdminRoleEnum.ADMIN, AdminRoleEnum.READ_ONLY]);

/**
 * Check if session has specific role
 */
export function hasAdminRole(session: AdminSession, role: AdminRole): boolean {
  return hasRole(session.role, [role]);
}

/**
 * Check if session can perform action based on role
 */
export function canPerformAction(session: AdminSession, action: string): boolean {
  switch (action) {
    case 'modify_system_settings':
      return session.role === AdminRoleEnum.SUPER_ADMIN;

    case 'create_admin':
    case 'update_admin':
    case 'delete_admin':
    case 'reactivate_admin':
    case 'create_client':
    case 'update_client':
    case 'delete_client':
    case 'view_audit_logs':
      return session.role === AdminRoleEnum.SUPER_ADMIN || session.role === AdminRoleEnum.ADMIN;

    case 'view_clients':
    case 'view_dashboard':
      return true; // All authenticated users can view

    default:
      return false;
  }
}

/**
 * Get user permissions based on role
 */
export function getUserPermissions(role: AdminRole): string[] {
  const permissions: string[] = ['view_dashboard', 'view_clients'];

  if (role === AdminRoleEnum.ADMIN || role === AdminRoleEnum.SUPER_ADMIN) {
    permissions.push(
      'create_client',
      'update_client',
      'delete_client',
      'view_audit_logs',
      'create_admin',
      'update_admin',
      'delete_admin',
      'reactivate_admin'
    );
  }

  if (role === AdminRoleEnum.SUPER_ADMIN) {
    permissions.push('modify_system_settings', 'view_system_logs');
  }

  return permissions;
}
