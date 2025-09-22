// Edge Middleware for Argan HR System
// Provides fast authentication checks at the edge before page rendering
// This runs on Vercel Edge Runtime for instant redirects

import { NextRequest, NextResponse } from 'next/server';

// Auth-related routes that have special handling
const AUTH_ROUTES = {
  LOGIN: '/admin/login',
  DASHBOARD: '/admin/dashboard',
};

/**
 * Edge-compatible session validation
 * Only validates the session cookie structure, not database state
 * Full validation happens in layouts/API routes
 */
async function validateSessionCookie(sessionCookie: string | undefined): Promise<boolean> {
  if (!sessionCookie) return false;

  try {
    // Get session secret from environment
    const sessionSecret = process.env.ADMIN_SESSION_SECRET;
    if (!sessionSecret) {
      console.error('ADMIN_SESSION_SECRET not configured');
      return false;
    }

    // For AES-256-GCM encrypted sessions, we need to check if we can decrypt
    // But jose/jwtVerify won't work with our AES encryption
    // So we'll do a basic validation that the cookie exists and has content
    // The actual decryption happens in the server components

    // Basic validation: cookie should be a non-empty base64 string
    if (!sessionCookie || sessionCookie.length < 50) {
      return false;
    }

    // Check if it looks like a valid base64 encrypted session
    const base64Regex = /^[A-Za-z0-9+/]+=*$/;
    if (!base64Regex.test(sessionCookie)) {
      return false;
    }

    // Cookie exists and appears valid - actual decryption happens server-side
    return true;
  } catch (error) {
    console.error('Session validation error:', error);
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static assets and API routes (except protected ones)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.') || // static files
    pathname.startsWith('/api/health') || // health checks
    pathname.startsWith('/api/auth/login') // login endpoint
  ) {
    return NextResponse.next();
  }

  // Check if this is a protected admin route
  const isProtectedRoute =
    pathname.startsWith('/admin') &&
    !pathname.startsWith('/admin/login');

  // For protected routes, validate session
  if (isProtectedRoute) {
    const sessionCookie = request.cookies.get('admin_session')?.value;
    const isValidSession = await validateSessionCookie(sessionCookie);

    if (!isValidSession) {
      // Redirect to login with return URL
      const loginUrl = new URL(AUTH_ROUTES.LOGIN, request.url);
      loginUrl.searchParams.set('redirect', pathname);

      // For API routes, return 401 instead of redirect
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        );
      }

      return NextResponse.redirect(loginUrl);
    }
  }

  // If user is logged in and tries to access login page, redirect to dashboard
  if (pathname === AUTH_ROUTES.LOGIN) {
    const sessionCookie = request.cookies.get('admin_session')?.value;
    const isValidSession = await validateSessionCookie(sessionCookie);

    if (isValidSession) {
      return NextResponse.redirect(new URL(AUTH_ROUTES.DASHBOARD, request.url));
    }
  }

  // Allow the request to continue
  return NextResponse.next();
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};