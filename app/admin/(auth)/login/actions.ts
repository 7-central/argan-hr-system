'use server';

/**
 * Authentication Server Actions
 * Handles login and logout operations
 */

import { redirect } from 'next/navigation';

import { authService } from '@/lib/services/business/auth.service';
import {
  checkLoginRateLimit,
  recordFailedLogin,
  resetLoginAttempts,
} from '@/lib/utils/system/rate-limit';
import { createAdminSession, clearAdminSession } from '@/lib/utils/system/session';

/**
 * Login action with rate limiting
 * Validates credentials and creates session on success
 */
export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  // Validate input
  if (!email || !password) {
    return {
      success: false,
      error: 'Email and password are required',
    };
  }

  // 1. Check rate limit FIRST (before expensive password check)
  const rateLimit = await checkLoginRateLimit(email);
  if (!rateLimit.allowed) {
    const lockedUntil = rateLimit.lockedUntil
      ? new Date(rateLimit.lockedUntil).toLocaleTimeString()
      : 'shortly';

    return {
      success: false,
      error: `Account locked due to too many failed attempts. Try again after ${lockedUntil}.`,
    };
  }

  // 2. Authenticate user
  const admin = await authService.authenticateAdmin(email, password);

  // 3a. If authentication failed
  if (!admin) {
    await recordFailedLogin(email);

    // Calculate remaining attempts
    const remaining = (rateLimit.remainingAttempts || 10) - 1;
    const attemptsMessage =
      remaining > 0 ? ` ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.` : '';

    return {
      success: false,
      error: `Invalid email or password.${attemptsMessage}`,
    };
  }

  // 3b. If authentication succeeded
  await resetLoginAttempts(email);

  // Create session
  await createAdminSession({
    id: admin.id,
    email: admin.email,
    role: admin.role,
    name: admin.name,
  });

  // Redirect to dashboard - let it throw (Next.js handles this)
  redirect('/admin');
}

/**
 * Logout action
 * Clears session and redirects to login
 */
export async function logoutAction() {
  await clearAdminSession();
  // Redirect to login - let it throw (Next.js handles this)
  redirect('/admin/login');
}
