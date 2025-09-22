// Login API route for Argan HR System
// Based on document-parser authentication patterns

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateAdmin } from '@/lib/auth/auth.service';
import { createAdminSession } from '@/lib/auth/session';
import { prisma } from '@/lib/system/database';
import { AuditAction } from '@prisma/client';

/**
 * Login request schema validation
 */
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * Rate limiting storage (in-memory for now)
 * In production, this should use Redis or a database
 */
const loginAttempts = new Map<string, { count: number; lastAttempt: number; blocked: boolean }>();

/**
 * Clean up old login attempts
 */
function cleanupOldAttempts() {
  const now = Date.now();
  const fifteenMinutes = 15 * 60 * 1000;

  for (const [email, attempt] of loginAttempts.entries()) {
    if (now - attempt.lastAttempt > fifteenMinutes) {
      loginAttempts.delete(email);
    }
  }
}

/**
 * Check and update rate limiting
 */
function checkRateLimit(email: string): { allowed: boolean; delay: number } {
  cleanupOldAttempts();

  const attempt = loginAttempts.get(email) || { count: 0, lastAttempt: 0, blocked: false };
  const now = Date.now();

  // Progressive delay: 2^attempts seconds, max 60 seconds
  const delay = Math.min(Math.pow(2, attempt.count) * 1000, 60000);

  // Check if still in delay period
  if (attempt.blocked && (now - attempt.lastAttempt) < delay) {
    return { allowed: false, delay };
  }

  return { allowed: true, delay: 0 };
}

/**
 * Record failed login attempt
 */
function recordFailedAttempt(email: string) {
  const attempt = loginAttempts.get(email) || { count: 0, lastAttempt: 0, blocked: false };

  loginAttempts.set(email, {
    count: attempt.count + 1,
    lastAttempt: Date.now(),
    blocked: attempt.count >= 2, // Block after 3 attempts
  });
}

/**
 * Clear login attempts on successful login
 */
function clearLoginAttempts(email: string) {
  loginAttempts.delete(email);
}

/**
 * Create audit log for authentication events
 */
async function createAuditLog(
  adminId: string | null,
  action: AuditAction,
  email: string,
  request: NextRequest,
  success: boolean
) {
  try {
    await prisma.auditLog.create({
      data: {
        adminId,
        action,
        entityType: 'authentication',
        entityId: null, // Authentication events don't operate on specific entities
        changes: {
          email,
          success,
          timestamp: new Date().toISOString(),
        },
        ipAddress: request.headers.get('x-forwarded-for') ||
                   request.headers.get('x-real-ip') ||
                   'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}

/**
 * POST /api/auth/login
 * Authenticate admin user and create session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request data
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const { email, password } = validationResult.data;

    // Check rate limiting
    const rateLimit = checkRateLimit(email);
    if (!rateLimit.allowed) {
      await createAuditLog(null, AuditAction.LOGIN_FAILED, email, request, false);

      return NextResponse.json(
        {
          success: false,
          error: 'Too many login attempts. Please try again later.',
          retryAfter: Math.ceil(rateLimit.delay / 1000), // seconds
        },
        { status: 429 }
      );
    }

    // Authenticate admin
    const admin = await authenticateAdmin(email, password);

    if (!admin) {
      recordFailedAttempt(email);
      await createAuditLog(null, AuditAction.LOGIN_FAILED, email, request, false);

      return NextResponse.json(
        {
          success: false,
          error: 'Invalid credentials',
        },
        { status: 401 }
      );
    }

    // Clear any previous failed attempts
    clearLoginAttempts(email);

    // Create session
    await createAdminSession({
      id: admin.id,
      email: admin.email,
      role: admin.role,
      name: admin.name,
    });

    // Create audit log for successful login
    await createAuditLog(admin.id, AuditAction.LOGIN_SUCCESS, email, request, true);

    return NextResponse.json({
      success: true,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        lastLogin: admin.lastLogin,
      },
    });

  } catch (error) {
    console.error('Login error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred during login',
      },
      { status: 500 }
    );
  }
}