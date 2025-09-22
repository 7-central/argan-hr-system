// Logout API route for Argan HR System
// Based on document-parser authentication patterns

import { NextRequest, NextResponse } from 'next/server';
import { validateAdminSession, clearAdminSession } from '@/lib/auth/session';
import { prisma } from '@/lib/system/database';
import { AuditAction } from '@prisma/client';

/**
 * Create audit log for logout event
 */
async function createLogoutAuditLog(
  adminId: string,
  email: string,
  request: NextRequest
) {
  try {
    await prisma.auditLog.create({
      data: {
        adminId,
        action: AuditAction.LOGOUT,
        entityType: 'authentication',
        entityId: null, // Authentication events don't operate on specific entities
        changes: {
          email,
          timestamp: new Date().toISOString(),
        },
        ipAddress: request.headers.get('x-forwarded-for') ||
                   request.headers.get('x-real-ip') ||
                   'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });
  } catch (error) {
    console.error('Failed to create logout audit log:', error);
  }
}

/**
 * POST /api/auth/logout
 * Clear admin session and log out user
 */
export async function POST(request: NextRequest) {
  try {
    // Get current session for audit logging
    const session = await validateAdminSession();

    if (session) {
      // Create audit log before clearing session
      await createLogoutAuditLog(session.adminId, session.email, request);
    }

    // Clear session cookie
    await clearAdminSession();

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

  } catch (error) {
    console.error('Logout error:', error);

    // Even if there's an error, still try to clear the session
    await clearAdminSession();

    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred during logout',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/logout
 * Alternative logout method for simple redirects
 */
export async function GET(request: NextRequest) {
  try {
    // Get current session for audit logging
    const session = await validateAdminSession();

    if (session) {
      // Create audit log before clearing session
      await createLogoutAuditLog(session.adminId, session.email, request);
    }

    // Clear session cookie
    await clearAdminSession();

    // Redirect to login page
    return NextResponse.redirect(new URL('/admin/login', request.url));

  } catch (error) {
    console.error('Logout error:', error);

    // Even if there's an error, still try to clear the session
    await clearAdminSession();

    // Redirect to login page
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }
}