// Authentication types for Argan HR System
// Based on document-parser security patterns

import type { AdminRole } from '@prisma/client';

/**
 * Session data structure stored in encrypted cookies
 */
export interface SessionData {
  email: string;
  adminId: string;
  role: AdminRole;
  name: string;
  createdAt: number;
  expiresAt: number;
}

/**
 * Admin session interface for route handlers
 */
export interface AdminSession {
  adminId: string;
  email: string;
  role: AdminRole;
  name: string;
}

/**
 * Authentication result from login attempt
 */
export interface AuthResult {
  success: boolean;
  admin?: AdminSession;
  error?: string;
}

/**
 * Rate limiting attempt tracking
 */
export interface LoginAttempt {
  email: string;
  attempts: number;
  lastAttempt: number;
  blocked: boolean;
}