'use client';

import { useOptimistic, useTransition } from 'react';

import type { ServerActionResult } from '@/lib/types/action';
import type { SerializableAdmin } from '@/lib/types/admin';

/**
 * Optimistic admin type with metadata flags
 */
export interface OptimisticAdmin extends SerializableAdmin {
  _optimistic?: boolean;
  _pending?: boolean;
  _error?: boolean;
}

/**
 * Action types for optimistic updates
 */
type OptimisticAction =
  | { type: 'delete'; id: string }
  | { type: 'reactivate'; id: string }
  | { type: 'error'; id: string }
  | { type: 'success'; id: string };

/**
 * useOptimisticAdmin Hook
 *
 * Manages optimistic updates for admin user operations
 * Provides immediate UI feedback for deactivate/reactivate actions
 *
 * Features:
 * - Optimistic deactivation with instant visual feedback
 * - Optimistic reactivation for quick undo
 * - Error state handling with rollback
 * - Pending state tracking during server operations
 * - Uses dependency injection for Server Actions (proper layer separation)
 *
 * @param initialAdmins - Initial admin users from server
 * @param deleteUserAction - Server Action for deleting users
 * @param reactivateUserAction - Server Action for reactivating users
 * @returns Optimistic admins list and action handlers
 */
export function useOptimisticAdmin(
  initialAdmins: SerializableAdmin[],
  deleteUserAction: (id: string) => Promise<ServerActionResult<unknown>>,
  reactivateUserAction: (id: string) => Promise<ServerActionResult<unknown>>
) {
  const [isPending, startTransition] = useTransition();

  const [optimisticAdmins, setOptimisticAdmins] = useOptimistic<OptimisticAdmin[], OptimisticAction>(
    initialAdmins,
    (state, action) => {
      switch (action.type) {
        case 'delete':
          // Mark admin as inactive optimistically
          return state.map((admin) =>
            admin.id === action.id
              ? {
                  ...admin,
                  isActive: false,
                  _optimistic: true,
                  _pending: true,
                  _error: false,
                }
              : admin
          );

        case 'reactivate':
          // Mark admin as active optimistically
          return state.map((admin) =>
            admin.id === action.id
              ? {
                  ...admin,
                  isActive: true,
                  _optimistic: true,
                  _pending: true,
                  _error: false,
                }
              : admin
          );

        case 'error':
          // Mark operation as failed
          return state.map((admin) =>
            admin.id === action.id
              ? {
                  ...admin,
                  _optimistic: true,
                  _pending: false,
                  _error: true,
                }
              : admin
          );

        case 'success':
          // Clear optimistic flags on success
          return state.map((admin) =>
            admin.id === action.id
              ? {
                  ...admin,
                  _optimistic: false,
                  _pending: false,
                  _error: false,
                }
              : admin
          );

        default:
          return state;
      }
    }
  );

  /**
   * Deactivate admin with optimistic update
   */
  const deleteAdminOptimistic = async (
    id: string
  ): Promise<{ success: boolean; error?: string }> => {
    startTransition(() => {
      setOptimisticAdmins({ type: 'delete', id });
    });

    // Call Server Action (returns result object, doesn't throw)
    const result = await deleteUserAction(id);

    if (result.success) {
      startTransition(() => {
        setOptimisticAdmins({ type: 'success', id });
      });

      return { success: true };
    } else {
      startTransition(() => {
        setOptimisticAdmins({ type: 'error', id });
      });

      return {
        success: false,
        error: result.error || 'Failed to deactivate admin user',
      };
    }
  };

  /**
   * Reactivate admin with optimistic update
   */
  const reactivateAdminOptimistic = async (
    id: string
  ): Promise<{ success: boolean; error?: string }> => {
    startTransition(() => {
      setOptimisticAdmins({ type: 'reactivate', id });
    });

    // Call Server Action (returns result object, doesn't throw)
    const result = await reactivateUserAction(id);

    if (result.success) {
      startTransition(() => {
        setOptimisticAdmins({ type: 'success', id });
      });

      return { success: true };
    } else {
      startTransition(() => {
        setOptimisticAdmins({ type: 'error', id });
      });

      return {
        success: false,
        error: result.error || 'Failed to reactivate admin user',
      };
    }
  };

  return {
    optimisticAdmins,
    isPending,
    deleteAdminOptimistic,
    reactivateAdminOptimistic,
  };
}
