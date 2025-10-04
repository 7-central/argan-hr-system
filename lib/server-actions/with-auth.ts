import { validateSession } from '@/lib/utils/system/session';

import type { AdminSession } from '@/lib/types/auth';

/**
 * Higher-order function to wrap Server Actions with authentication
 *
 * Usage:
 * ```typescript
 * export const saveClient = withAuth(async (session, data) => {
 *   return await clientService.create(data, session.adminId)
 * })
 * ```
 */
export function withAuth<TArgs extends unknown[], TResult>(
  handler: (session: AdminSession, ...args: TArgs) => Promise<TResult>
) {
  return async (...args: TArgs): Promise<TResult> => {
    const session = await validateSession();

    if (!session) {
      throw new Error('Unauthorized: No valid session found');
    }

    return handler(session, ...args);
  };
}
