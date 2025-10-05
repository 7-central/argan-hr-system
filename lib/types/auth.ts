// Authentication types for Argan HR System
// Based on document-parser security patterns

import type { AdminRole } from './admin';

/**
 * Admin session interface for route handlers
 * Shared across middleware, server actions, and RBAC
 */
export interface AdminSession {
  adminId: string;
  email: string;
  role: AdminRole;
  name: string;
}
