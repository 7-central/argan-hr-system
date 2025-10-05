import { z } from 'zod';

import { AdminRoleEnum } from '@/lib/types/admin';


/**
 * Password validation schema
 * Requires at least 8 characters with uppercase, lowercase, and number
 */
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

/**
 * Admin role enum for validation
 */
const adminRoleSchema = z.enum([AdminRoleEnum.SUPER_ADMIN, AdminRoleEnum.ADMIN, AdminRoleEnum.READ_ONLY], {
  message: 'Please select a valid role',
});

/**
 * Create admin form validation schema
 */
export const createAdminSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z.string().email('Please enter a valid email address'),
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  role: adminRoleSchema,
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

/**
 * Edit admin form validation schema
 * Password is optional (only required if changing password)
 */
export const editAdminSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z.string().email('Please enter a valid email address'),
  role: adminRoleSchema,
  isActive: z.boolean(),
  changePassword: z.boolean(),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
}).refine(
  (data) => {
    // If changing password, validate password fields
    if (data.changePassword) {
      return data.password && data.password.length >= 8;
    }
    return true;
  },
  {
    message: 'Password must be at least 8 characters',
    path: ['password'],
  }
).refine(
  (data) => {
    // If changing password, passwords must match
    if (data.changePassword) {
      return data.password === data.confirmPassword;
    }
    return true;
  },
  {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  }
).refine(
  (data) => {
    // If changing password, validate password strength
    if (data.changePassword && data.password) {
      return (
        /[A-Z]/.test(data.password) &&
        /[a-z]/.test(data.password) &&
        /[0-9]/.test(data.password)
      );
    }
    return true;
  },
  {
    message: 'Password must contain uppercase, lowercase, and number',
    path: ['password'],
  }
);

/**
 * Infer TypeScript types from schemas
 */
export type CreateAdminFormValues = z.infer<typeof createAdminSchema>;
export type EditAdminFormValues = z.infer<typeof editAdminSchema>;
