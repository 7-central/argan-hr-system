'use server';

import { withAuth } from '@/lib/server-actions/with-auth';
import { clientService } from '@/lib/services/business/client.service';

import type { SerializableClientResponse } from '@/lib/types/client';

/**
 * Document Management Server Actions
 * Handles data fetching for document management
 */

/**
 * Get all clients for document management
 * Returns clients with serialized data for client components
 */
export const getClientsForDocuments = withAuth(
  async (): Promise<SerializableClientResponse> => {
    const result = await clientService.getClients({ page: 1, limit: 100 });

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
