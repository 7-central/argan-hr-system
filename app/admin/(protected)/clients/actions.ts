'use server';

import { withAuth } from '@/lib/server-actions/with-auth';
import { clientService } from '@/lib/services/business/client.service';


import type {
  CreateClientDto,
  GetClientsParams,
  UpdateClientDto,
} from '@/lib/services/business/client.service';

/**
 * Client Management Server Actions
 * All actions require authentication via withAuth wrapper
 */

// Re-export types for use in pages/components
export type { CreateClientDto, UpdateClientDto };

// Get clients with pagination and filtering
export const getClients = withAuth(async (session, params?: GetClientsParams) => {
  return await clientService.getClients(params || { page: 1, limit: 25 });
});

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
