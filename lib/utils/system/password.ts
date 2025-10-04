// Password security utilities for Argan HR System
// Based on document-parser proven patterns

import bcrypt from 'bcryptjs';

/**
 * Hash a password using bcryptjs with 12 rounds
 * Higher than document-parser's 10 rounds for enhanced security
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12);
}

/**
 * Verify a password against its hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * Validate password strength requirements
 * Minimum 8 characters, at least one uppercase, lowercase, and number
 */
export function validatePasswordStrength(password: string): boolean {
  const minLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);

  return minLength && hasUpper && hasLower && hasNumber;
}

/**
 * Generate a secure random password for admin creation
 * 16 characters with mixed case, numbers, and special characters
 */
export function generateSecurePassword(): string {
  const length = 16;
  const charset =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  let password = '';

  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }

  return password;
}
