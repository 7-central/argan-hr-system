/**
 * Rate Limiting Utility
 * Handles login attempt tracking and account locking
 */

import { prisma } from '@/lib/database';

/**
 * Rate limiting configuration
 */
const RATE_LIMIT_CONFIG = {
  maxAttempts: 10, // Max failed login attempts
  windowMinutes: 15, // Reset after 15 minutes
  lockoutMinutes: 15, // Lock account for 15 minutes after max attempts
};

/**
 * Check if account is rate limited (locked)
 * Returns true if account can proceed, false if locked
 */
export async function checkLoginRateLimit(email: string): Promise<{
  allowed: boolean;
  remainingAttempts?: number;
  lockedUntil?: Date;
}> {
  const admin = await prisma.admin.findUnique({
    where: { email },
    select: {
      failedLoginAttempts: true,
      lastFailedAttempt: true,
      lockedUntil: true,
    },
  });

  if (!admin) {
    // Admin doesn't exist - allow attempt (will fail in auth check)
    return { allowed: true, remainingAttempts: RATE_LIMIT_CONFIG.maxAttempts };
  }

  const now = new Date();

  // Check if account is currently locked
  if (admin.lockedUntil && admin.lockedUntil > now) {
    return {
      allowed: false,
      lockedUntil: admin.lockedUntil,
    };
  }

  // Check if we need to reset the attempt counter (window expired)
  if (admin.lastFailedAttempt) {
    const windowExpired =
      now.getTime() - admin.lastFailedAttempt.getTime() >
      RATE_LIMIT_CONFIG.windowMinutes * 60 * 1000;

    if (windowExpired) {
      // Reset counter
      await prisma.admin.update({
        where: { email },
        data: {
          failedLoginAttempts: 0,
          lastFailedAttempt: null,
          lockedUntil: null,
        },
      });
      return { allowed: true, remainingAttempts: RATE_LIMIT_CONFIG.maxAttempts };
    }
  }

  // Check if max attempts reached
  if (admin.failedLoginAttempts >= RATE_LIMIT_CONFIG.maxAttempts) {
    // Lock the account
    const lockUntil = new Date(now.getTime() + RATE_LIMIT_CONFIG.lockoutMinutes * 60 * 1000);

    await prisma.admin.update({
      where: { email },
      data: { lockedUntil: lockUntil },
    });

    return {
      allowed: false,
      lockedUntil: lockUntil,
    };
  }

  // Account is not locked and has remaining attempts
  const remainingAttempts = RATE_LIMIT_CONFIG.maxAttempts - admin.failedLoginAttempts;
  return { allowed: true, remainingAttempts };
}

/**
 * Record a failed login attempt
 */
export async function recordFailedLogin(email: string): Promise<void> {
  const now = new Date();

  await prisma.admin.update({
    where: { email },
    data: {
      failedLoginAttempts: { increment: 1 },
      lastFailedAttempt: now,
    },
  });
}

/**
 * Reset login attempts on successful login
 */
export async function resetLoginAttempts(email: string): Promise<void> {
  await prisma.admin.update({
    where: { email },
    data: {
      failedLoginAttempts: 0,
      lastFailedAttempt: null,
      lockedUntil: null,
    },
  });
}
