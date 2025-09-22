// Main authentication exports for Argan HR System
// Based on document-parser proven security patterns

export { validateAdminSession, createAdminSession, clearAdminSession } from './session';
export { authenticateAdmin, type AuthenticatedAdmin } from './auth.service';
export { hashPassword, verifyPassword, validatePasswordStrength } from './password';
export { type SessionData, type AdminSession } from './types';
export { requireRole, requireSuperAdmin, requireAdmin, requireViewer, hasAdminRole, canPerformAction, getUserPermissions } from './rbac';