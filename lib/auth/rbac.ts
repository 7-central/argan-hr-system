// Role-based access control for Argan HR System
// Based on document-parser RBAC patterns

import { NextRequest, NextResponse } from 'next/server';
import { AdminRole } from '@prisma/client';
import { validateAdminSession } from './session';
import type { AdminSession } from './types';

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
 * VIEWER has read-only permissions
 */
const ROLE_HIERARCHY = {
  [AdminRole.SUPER_ADMIN]: 3,
  [AdminRole.ADMIN]: 2,
  [AdminRole.VIEWER]: 1,
};

/**
 * Check if user role has sufficient permissions
 */
function hasRole(userRole: AdminRole, requiredRoles: AdminRole[]): boolean {
  return requiredRoles.some(role =>
    ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[role]
  );
}

/**
 * Require specific roles for route access
 */
export function requireRole(allowedRoles: AdminRole[]) {
  return async function (request: NextRequest): Promise<NextResponse | null> {
    const session = await validateAdminSession();

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
          current: session.role
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
export const requireSuperAdmin = () => requireRole([AdminRole.SUPER_ADMIN]);

/**
 * Require ADMIN or higher role
 */
export const requireAdmin = () => requireRole([AdminRole.SUPER_ADMIN, AdminRole.ADMIN]);

/**
 * Require any authenticated user (VIEWER or higher)
 */
export const requireViewer = () => requireRole([AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.VIEWER]);

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
    case 'create_admin':
    case 'delete_admin':
    case 'modify_system_settings':
      return session.role === AdminRole.SUPER_ADMIN;

    case 'create_client':
    case 'update_client':
    case 'delete_client':
    case 'view_audit_logs':
      return session.role === AdminRole.SUPER_ADMIN || session.role === AdminRole.ADMIN;

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

  if (role === AdminRole.ADMIN || role === AdminRole.SUPER_ADMIN) {
    permissions.push(
      'create_client',
      'update_client',
      'delete_client',
      'view_audit_logs'
    );
  }

  if (role === AdminRole.SUPER_ADMIN) {
    permissions.push(
      'create_admin',
      'delete_admin',
      'modify_system_settings',
      'view_system_logs'
    );
  }

  return permissions;
}