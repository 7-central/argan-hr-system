'use server';

import { withAuth } from '@/lib/server-actions/with-auth';
import { clientService } from '@/lib/services/business/client.service';

import type {
  CreateClientDto,
  GetClientsParams,
  UpdateClientDto,
  SerializableClientResponse,
} from '@/lib/types/client';

/**
 * Client Management Server Actions
 * All actions require authentication via withAuth wrapper
 */

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

// TODO: Implement create client action
export const createClient = withAuth(async (_session, _data: CreateClientDto) => {
  // Placeholder for create client logic
  throw new Error('Not implemented yet');
});

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
