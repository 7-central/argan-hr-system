// Session management for Argan HR System
// Based on document-parser AES-256-GCM encryption patterns

import { cookies } from 'next/headers';

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

import { config } from './config';

import type { AdminRole } from '@/lib/types/admin';
import type { AdminSession } from '@/lib/types/auth';

/**
 * Session data structure stored in encrypted cookies
 * Internal implementation detail - not exported
 */
interface SessionData {
  email: string;
  adminId: string;
  role: AdminRole;
  name: string;
  createdAt: number;
  expiresAt: number;
}

/**
 * Cookie configuration for admin sessions
 */
const COOKIE_CONFIG = {
  name: 'admin_session',
  httpOnly: true,
  secure: config.app.isProduction,
  sameSite: 'lax' as const,
  path: '/admin',
};

/**
 * Encrypt session data using AES-256-GCM (document-parser pattern)
 */
function encryptSession(data: SessionData, secret: string): string {
  const iv = randomBytes(16);
  const key = Buffer.from(secret, 'hex');
  const cipher = createCipheriv('aes-256-gcm', key, iv);

  const encrypted = Buffer.concat([cipher.update(JSON.stringify(data), 'utf8'), cipher.final()]);

  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

/**
 * Decrypt session data using AES-256-GCM (document-parser pattern)
 */
function decryptSession(encryptedData: string, secret: string): SessionData | null {
  try {
    const buffer = Buffer.from(encryptedData, 'base64');
    const iv = buffer.subarray(0, 16);
    const authTag = buffer.subarray(16, 32);
    const encrypted = buffer.subarray(32);

    const key = Buffer.from(secret, 'hex');
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

    return JSON.parse(decrypted.toString('utf8'));
  } catch (error) {
    console.error('Session decryption failed:', error);
    return null;
  }
}

/**
 * Check if session has expired
 */
function isSessionExpired(session: SessionData): boolean {
  return Date.now() > session.expiresAt;
}

/**
 * Create session data structure
 */
function createSessionData(admin: {
  id: string;
  email: string;
  role: AdminRole;
  name: string;
}): SessionData {
  const now = Date.now();

  return {
    email: admin.email,
    adminId: admin.id,
    role: admin.role,
    name: admin.name,
    createdAt: now,
    expiresAt: now + config.auth.sessionDuration * 1000, // Convert seconds to milliseconds
  };
}

/**
 * Create an admin session with encrypted cookie
 */
export async function createAdminSession(admin: {
  id: string;
  email: string;
  role: AdminRole;
  name: string;
}): Promise<void> {
  const sessionData = createSessionData(admin);
  const encryptedSession = encryptSession(sessionData, config.auth.sessionSecret);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_CONFIG.name, encryptedSession, {
    ...COOKIE_CONFIG,
    expires: new Date(sessionData.expiresAt),
  });
}

/**
 * Validate session from cookie
 */
export async function validateSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_CONFIG.name);

  if (!sessionCookie) {
    return null;
  }

  try {
    const sessionData = decryptSession(sessionCookie.value, config.auth.sessionSecret);
    if (!sessionData || isSessionExpired(sessionData)) {
      // Don't try to clear cookies in Server Components
      // The redirect will handle the cleanup
      return null;
    }
    return {
      adminId: sessionData.adminId,
      email: sessionData.email,
      role: sessionData.role,
      name: sessionData.name,
    };
  } catch (error) {
    // Session decryption failed - invalid or corrupted session
    console.error('Session validation error:', error);
    return null;
  }
}

/**
 * Clear admin session cookie
 */
export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_CONFIG.name, '', {
    ...COOKIE_CONFIG,
    expires: new Date(0), // Expire immediately
  });
}
