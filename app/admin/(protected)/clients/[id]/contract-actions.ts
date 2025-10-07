'use server';

import { revalidatePath } from 'next/cache';

import { withAuth } from '@/lib/server-actions/with-auth';
import { contractService } from '@/lib/services/business/contract.service';

import type { ServiceInScope, ServiceOutOfScope } from '@/lib/constants/contract';

/**
 * Contract Management Server Actions
 * All actions require authentication via withAuth wrapper
 */

/**
 * Update contract inclusive services (In Scope)
 * Returns result object following architectural patterns
 */
export const updateServicesInScope = withAuth(
  async (
    _session,
    contractId: number,
    services: ServiceInScope[]
  ): Promise<{ success: boolean; data?: { inclusiveServicesInScope: string[] }; error?: string }> => {
    try {
      // Update the contract using service layer
      const contract = await contractService.updateServicesInScope(contractId, services);

      // Revalidate the client page to show updated data
      revalidatePath(`/admin/clients/${contract.clientId}`);

      return {
        success: true,
        data: {
          inclusiveServicesInScope: contract.inclusiveServicesInScope,
        },
      };
    } catch (error) {
      // Handle business errors with user-friendly messages
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
        };
      }

      // Handle unexpected errors
      return {
        success: false,
        error: 'An unexpected error occurred while updating services in scope',
      };
    }
  }
);

/**
 * Update contract services (Out of Scope)
 * Returns result object following architectural patterns
 */
export const updateServicesOutOfScope = withAuth(
  async (
    _session,
    contractId: number,
    services: ServiceOutOfScope[]
  ): Promise<{ success: boolean; data?: { inclusiveServicesOutOfScope: string[] }; error?: string }> => {
    try {
      // Update the contract using service layer
      const contract = await contractService.updateServicesOutOfScope(contractId, services);

      // Revalidate the client page to show updated data
      revalidatePath(`/admin/clients/${contract.clientId}`);

      return {
        success: true,
        data: {
          inclusiveServicesOutOfScope: contract.inclusiveServicesOutOfScope,
        },
      };
    } catch (error) {
      // Handle business errors with user-friendly messages
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
        };
      }

      // Handle unexpected errors
      return {
        success: false,
        error: 'An unexpected error occurred while updating services out of scope',
      };
    }
  }
);
