/**
 * Error Handling Wrapper for Server Actions
 * Provides centralized error handling for all Server Actions
 */

import { AppError } from '@/lib/errors';
import { SystemError } from '@/lib/errors/system';

/**
 * Standard Server Action response format
 */
export interface ServerActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Wrap Server Actions with standardized error handling
 *
 * Usage:
 * ```typescript
 * export const createClient = withErrorHandling(async (formData: FormData) => {
 *   // Your logic here - can throw errors
 *   const client = await clientService.create(...)
 *   return client
 * })
 * ```
 */
export function withErrorHandling<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>
): (...args: TArgs) => Promise<ServerActionResponse<TResult>> {
  return async (...args: TArgs): Promise<ServerActionResponse<TResult>> => {
    try {
      const result = await action(...args);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('Server Action error:', error);

      // Handle Business errors (expected, operational)
      if (error instanceof AppError) {
        return {
          success: false,
          error: error.message,
        };
      }

      // Handle System errors (infrastructure issues)
      if (error instanceof SystemError) {
        return {
          success: false,
          error: 'A system error occurred. Please try again.',
        };
      }

      // Handle unexpected errors (don't leak details)
      return {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      };
    }
  };
}
