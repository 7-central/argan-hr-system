// Pre-composed middleware stacks
// Provides ready-to-use middleware combinations for different endpoint types

import { NextResponse } from 'next/server';
import { compose } from './compose';
import { withAuth, type AuthenticatedRequest } from './auth';
import { withErrorHandling } from './withErrorHandling';
import { withRequestLogging, withAccessLog } from './withRequestLogging';

/**
 * Infrastructure endpoints (health, metrics, status)
 * Minimal middleware - no auth, basic logging
 */
export const infrastructureStack = compose(
  withErrorHandling(),
  withAccessLog()
);

/**
 * Public API endpoints (login, public data)
 * Error handling and logging, but no auth
 */
export const publicApiStack = compose(
  withErrorHandling(),
  withRequestLogging()
);

/**
 * Protected business API endpoints (clients, data operations)
 * Full middleware stack with auth
 * Note: withAuth is applied directly, not through compose
 */
export function businessApiStack<T = unknown>(
  handler: (request: AuthenticatedRequest, context?: T) => Promise<NextResponse> | NextResponse
) {
  // Apply middleware in order: error handling -> logging -> auth
  return withErrorHandling<T>()(
    withRequestLogging<T>()(
      withAuth<T>(handler)
    )
  );
}

/**
 * Admin API endpoints (user management, system operations)
 * Enhanced stack with additional audit capabilities
 * Note: Audit logging would be added in Phase 2
 */
export function adminApiStack<T = unknown>(
  handler: (request: AuthenticatedRequest, context?: T) => Promise<NextResponse> | NextResponse
) {
  return withErrorHandling<T>()(
    withRequestLogging<T>()(
      withAuth<T>(handler)
      // Future: withAuditLogging
    )
  );
}

/**
 * Alias for backward compatibility and clarity
 */
export const protectedApiStack = businessApiStack;

/**
 * Export individual middleware for custom compositions
 */
export { withAuth } from './auth';
export { withErrorHandling, withErrorLogging } from './withErrorHandling';
export { withRequestLogging, withAccessLog } from './withRequestLogging';
export { compose, conditional } from './compose';