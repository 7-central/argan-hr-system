'use server';

import { withAuth } from '@/lib/server-actions/with-auth';
import { clientService } from '@/lib/services/business/client.service';

import type {
  Client,
  CreateClientDto,
  GetClientsParams,
  UpdateClientDto,
  SerializableClientResponse,
} from '@/lib/types/client';

/**
 * Client Management Server Actions
 * All actions require authentication via withAuth wrapper
 */

/**
 * Get unique sectors from the database
 * Used to populate the sector dropdown with existing values
 */
export async function getUniqueSectors(): Promise<string[]> {
  return clientService.getUniqueSectors();
}

// Get clients with pagination and filtering
export const getClients = withAuth(
  async (session, params?: GetClientsParams): Promise<SerializableClientResponse> => {
    const result = await clientService.getClients(params || { page: 1, limit: 25 });

    // Convert Decimal fields to number for client component serialization
    const clients = result.clients.map((client) => ({
      ...client,
      monthlyRetainer: client.monthlyRetainer ? Number(client.monthlyRetainer) : null,
    }));

    return {
      ...result,
      clients,
    };
  }
);

/**
 * Create new client with proper error handling
 * Returns result object (not throwing errors) following architectural patterns
 */
export const createClient = withAuth(
  async (
    _session,
    data: CreateClientDto
  ): Promise<{ success: boolean; data?: Client; error?: string }> => {
    try {
      const client = await clientService.createClient(data);

      // Convert Decimal to number for client serialization
      const serializedClient = {
        ...client,
        monthlyRetainer: client.monthlyRetainer ? Number(client.monthlyRetainer) : null,
      };

      return {
        success: true,
        data: serializedClient,
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
        error: 'An unexpected error occurred while creating the client',
      };
    }
  }
);

// TODO: Implement update client action
export const updateClient = withAuth(async (_session, _id: string, _data: UpdateClientDto) => {
  // Placeholder for update client logic
  throw new Error('Not implemented yet');
});

// TODO: Implement delete client action
export const deleteClient = withAuth(async (_session, _id: string) => {
  // Placeholder for delete client logic
  throw new Error('Not implemented yet');
});
