'use client';

import { useOptimistic, useCallback } from 'react';

import { useRouter } from 'next/navigation';

import {
  createClient as createClientAction,
  updateClient as updateClientAction,
  deleteClient as deleteClientAction,
} from '@/lib/actions/client.actions';

import type { Client, CreateClientDto, UpdateClientDto } from '@/lib/types/client';

/**
 * Optimistic state for client operations
 * Used by useOptimistic reducer to manage client state transitions
 */
export interface OptimisticClientAction {
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  client: CreateClientDto | UpdateClientDto | { id: number };
  tempId?: number;
}

/**
 * Client with optimistic state indicators
 * Extends base Client with loading and error states
 */
export interface OptimisticClient extends Client {
  _optimistic?: boolean;
  _pending?: boolean;
  _error?: string | null;
}

/**
 * Reducer function for useOptimistic hook
 * Handles optimistic client operations with full type safety
 *
 * @param state - Current array of clients
 * @param action - Optimistic action to perform
 * @returns Updated client array with optimistic changes
 */
function optimisticClientReducer(
  state: OptimisticClient[],
  action: OptimisticClientAction
): OptimisticClient[] {
  switch (action.type) {
    case 'CREATE': {
      const clientData = action.client as CreateClientDto;

      const optimisticClient: OptimisticClient = {
        id: action.tempId || -1,
        clientType: clientData.clientType || 'COMPANY',
        companyName: clientData.companyName || '',
        serviceTier: clientData.serviceTier || 'TIER_1',
        status: clientData.status || 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: '',
        businessId: clientData.businessId || null,
        sector: clientData.sector || null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        monthlyRetainer: clientData.monthlyRetainer as any,
        contractStartDate: clientData.contractStartDate || null,
        contractRenewalDate: clientData.contractRenewalDate || null,
        welcomeEmailSent: false,
        externalAudit: false,
        paymentMethod: null,
        chargeVat: clientData.chargeVat ?? true,
        directDebitSetup: false,
        directDebitConfirmed: false,
        contractAddedToXero: false,
        recurringInvoiceSetup: false,
        dpaSignedGdpr: false,
        firstInvoiceSent: false,
        firstPaymentMade: false,
        lastPriceIncrease: null,
        _optimistic: true,
        _pending: true,
        _error: null,
      };

      return [optimisticClient, ...state];
    }

    case 'UPDATE': {
      const updateData = action.client as UpdateClientDto & { id: number };
      return state.map((client) => {
        if (client.id === updateData.id) {
          return {
            ...client,
            ...updateData,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            monthlyRetainer: (updateData.monthlyRetainer as any) ?? client.monthlyRetainer,
            _optimistic: true,
            _pending: true,
            _error: null,
          };
        }
        return client;
      });
    }

    case 'DELETE': {
      const deleteData = action.client as { id: number };
      return state.map((client) => {
        if (client.id === deleteData.id) {
          // Toggle status: ACTIVE -> INACTIVE, INACTIVE -> ACTIVE
          const newStatus = client.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
          return {
            ...client,
            status: newStatus as 'ACTIVE' | 'INACTIVE',
            _optimistic: true,
            _pending: true,
            _error: null,
          };
        }
        return client;
      });
    }

    default:
      return state;
  }
}

/**
 * Response type for optimistic client operations
 * Provides consistent return structure with success/error states
 */
export interface OptimisticClientResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Hook for managing optimistic client operations
 * Provides immediate UI updates with error rollback functionality
 *
 * @param initialClients - Initial array of clients
 * @returns Optimistic client state and operation functions
 *
 * @example
 * ```typescript
 * const {
 *   optimisticClients,
 *   createClientOptimistic,
 *   updateClientOptimistic,
 *   deleteClientOptimistic
 * } = useOptimisticClient(clients)
 *
 * const handleCreateClient = async (data: CreateClientDto) => {
 *   const result = await createClientOptimistic(data)
 *   if (result.success) {
 *     router.push('/admin/clients')
 *   } else {
 *     // Error handling - optimistic state already rolled back
 *     showErrorToast(result.error)
 *   }
 * }
 * ```
 */
export function useOptimisticClient(initialClients: Client[]) {
  const router = useRouter();

  // Convert initial clients to optimistic clients
  const initialOptimisticClients: OptimisticClient[] = initialClients.map((client) => ({
    ...client,
    _optimistic: false,
    _pending: false,
    _error: null,
  }));

  const [optimisticClients, addOptimistic] = useOptimistic<
    OptimisticClient[],
    OptimisticClientAction
  >(initialOptimisticClients, optimisticClientReducer);

  /**
   * Create a client with optimistic updates
   * Shows immediate feedback, then handles server response
   *
   * @param data - Client creation data
   * @returns Promise with operation result
   */
  const createClientOptimistic = useCallback(
    async (data: CreateClientDto): Promise<OptimisticClientResponse<Client>> => {
      // Generate temporary ID for optimistic update (negative number to avoid conflicts)
      const tempId = -Date.now();

      // Apply optimistic update immediately
      addOptimistic({
        type: 'CREATE',
        client: data,
        tempId,
      });

      try {
        // Call Server Action to create client
        const result = await createClientAction(data);

        if (!result.success) {
          // Server error - rollback optimistic update
          const errorMessage = result.error || 'Failed to create client';
          throw new Error(errorMessage);
        }

        // Success - the server state will update naturally
        // The temporary client will be replaced by real data
        router.refresh();

        return {
          success: true,
          data: result.data,
        };
      } catch (error) {
        // Error occurred - optimistic state needs to be handled
        // Note: In a production app, we'd want to trigger a state refresh
        // For now, we'll rely on the user refreshing or navigating away
        const errorMessage =
          error instanceof Error ? error.message : 'An unexpected error occurred';

        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    [addOptimistic, router]
  );

  /**
   * Update a client with optimistic updates
   * Shows immediate feedback, then handles server response
   *
   * @param id - Client ID to update
   * @param data - Update data
   * @returns Promise with operation result
   */
  const updateClientOptimistic = useCallback(
    async (id: number, data: UpdateClientDto): Promise<OptimisticClientResponse<Client>> => {
      // Apply optimistic update immediately
      addOptimistic({
        type: 'UPDATE',
        client: { id, ...data },
      });

      try {
        // Call Server Action to update client
        const result = await updateClientAction(id, data);

        if (!result.success) {
          // Server error - rollback optimistic update
          const errorMessage = result.error || 'Failed to update client';
          throw new Error(errorMessage);
        }

        // Success - refresh to get latest state
        router.refresh();

        return {
          success: true,
          data: result.data,
        };
      } catch (error) {
        // Error occurred - need to handle rollback
        const errorMessage =
          error instanceof Error ? error.message : 'An unexpected error occurred';

        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    [addOptimistic, router]
  );

  /**
   * Delete a client with optimistic updates (soft delete/status change)
   * Shows immediate feedback, then handles server response
   *
   * @param id - Client ID to delete
   * @param targetStatus - Optional target status (PENDING or INACTIVE) for ACTIVE clients
   * @returns Promise with operation result
   */
  const deleteClientOptimistic = useCallback(
    async (id: number, targetStatus?: 'PENDING' | 'INACTIVE'): Promise<OptimisticClientResponse<Client>> => {
      // Apply optimistic update immediately (soft delete)
      addOptimistic({
        type: 'DELETE',
        client: { id },
      });

      try {
        // Call Server Action to delete client
        const result = await deleteClientAction(id, targetStatus);

        if (!result.success) {
          // Server error - rollback optimistic update
          const errorMessage = result.error || 'Failed to update client status';
          throw new Error(errorMessage);
        }

        // Success - refresh to get latest state
        router.refresh();

        return {
          success: true,
          data: result.data,
        };
      } catch (error) {
        // Error occurred - need to handle rollback
        const errorMessage =
          error instanceof Error ? error.message : 'An unexpected error occurred';

        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    [addOptimistic, router]
  );

  return {
    optimisticClients,
    createClientOptimistic,
    updateClientOptimistic,
    deleteClientOptimistic,
  };
}

/**
 * Type for the useOptimisticClient hook return value
 * Provides full typing for consumers of the hook
 */
export type UseOptimisticClientReturn = ReturnType<typeof useOptimisticClient>;
