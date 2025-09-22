// Authentication middleware for Argan HR System
// Based on document-parser middleware patterns

import { NextRequest, NextResponse } from 'next/server';
import { validateAdminSession } from '@/lib/auth/session';
import type { AdminSession } from '@/lib/auth/types';

/**
 * Request with authenticated admin session
 */
export interface AuthenticatedRequest extends NextRequest {
  adminSession: AdminSession;
}

/**
 * Protected route configuration
 */
const PROTECTED_PATHS = [
  '/admin',
  '/api/admin',
  '/api/clients',
  '/api/auth/logout',
];

/**
 * Public paths that don't require authentication
 */
const PUBLIC_PATHS = [
  '/admin/login',
  '/api/auth/login',
  '/',
];

/**
 * Check if path requires authentication
 */
function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some(path => pathname.startsWith(path));
}

/**
 * Check if path is public (no auth required)
 */
function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(path => pathname === path || pathname.startsWith(path));
}

/**
 * Authentication middleware for API routes
 */
export async function authenticateRequest(
  request: NextRequest
): Promise<{ session: AdminSession | null; response: NextResponse | null }> {
  const { pathname } = request.nextUrl;

  // Skip authentication for public paths
  if (isPublicPath(pathname)) {
    return { session: null, response: null };
  }

  // Require authentication for protected paths
  if (isProtectedPath(pathname)) {
    const session = await validateAdminSession();

    if (!session) {
      // Return unauthorized response for API routes
      if (pathname.startsWith('/api/')) {
        return {
          session: null,
          response: NextResponse.json(
            { success: false, error: 'Unauthorized - Please log in' },
            { status: 401 }
          ),
        };
      }

      // Redirect to login for page routes
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return {
        session: null,
        response: NextResponse.redirect(loginUrl),
      };
    }

    return { session, response: null };
  }

  return { session: null, response: null };
}

/**
 * Higher-order function to protect API route handlers
 * Acts as middleware that adds authentication to handlers
 */
export function withAuth<T = unknown>(
  handler: (request: AuthenticatedRequest, context?: T) => Promise<NextResponse> | NextResponse
) {
  return async (request: NextRequest, context?: T): Promise<NextResponse> => {
    const { session, response } = await authenticateRequest(request);

    if (response) {
      return response;
    }

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Add session to request
    const authenticatedRequest = Object.create(Object.getPrototypeOf(request), {
      ...Object.getOwnPropertyDescriptors(request),
      adminSession: {
        value: session,
        writable: false,
        enumerable: true,
        configurable: false,
      },
    }) as AuthenticatedRequest;

    const result = handler(authenticatedRequest, context);
    return result instanceof Promise ? result : Promise.resolve(result);
  };
}

/**
 * Middleware for page protection (used in layouts)
 */
export async function requireAuth(): Promise<AdminSession | null> {
  return await validateAdminSession();
}

/**
 * Create error response for unauthorized access
 */
export function createUnauthorizedResponse(message = 'Unauthorized'): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code: 'UNAUTHORIZED',
    },
    { status: 401 }
  );
}

/**
 * Create forbidden response for insufficient permissions
 */
export function createForbiddenResponse(message = 'Forbidden'): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code: 'FORBIDDEN',
    },
    { status: 403 }
  );
}