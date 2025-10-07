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

/**
 * Update existing client with proper error handling
 * Returns result object (not throwing errors) following architectural patterns
 */
export const updateClient = withAuth(
  async (
    _session,
    id: number,
    data: UpdateClientDto
  ): Promise<{ success: boolean; data?: Client; error?: string }> => {
    try {
      const client = await clientService.updateClient(id, data);

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
        error: 'An unexpected error occurred while updating the client',
      };
    }
  }
);

/**
 * Delete (soft delete) client with proper error handling
 * Returns result object (not throwing errors) following architectural patterns
 */
export const deleteClient = withAuth(
  async (
    _session,
    id: number
  ): Promise<{ success: boolean; data?: Client; error?: string }> => {
    try {
      const client = await clientService.deleteClient(id);

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
        error: 'An unexpected error occurred while deleting the client',
      };
    }
  }
);

/**
 * Get onboarding data for a client and their active contract
 */
export const getOnboarding = withAuth(
  async (
    _session,
    clientId: number
  ): Promise<{
    success: boolean;
    data?: {
      client: { id: number; companyName: string; welcomeEmailSent: boolean };
      contract: {
        id: number;
        contractNumber: string;
        directDebitSetup: boolean;
        directDebitConfirmed: boolean;
        signedContractReceived: boolean;
        contractUploaded: boolean;
        contractAddedToXero: boolean;
        contractSentToClient: boolean;
        dpaSignedGdpr: boolean;
        firstInvoiceSent: boolean;
        firstPaymentMade: boolean;
        paymentTermsAgreed: boolean;
      } | null;
    };
    error?: string;
  }> => {
    try {
      const client = await clientService.getClientById(clientId);

      if (!client) {
        return {
          success: false,
          error: 'Client not found',
        };
      }

      // Get active contract - for now we'll use a direct DB query
      // TODO: Move this to a proper service method
      const { getDatabaseInstance } = await import('@/lib/database');
      const db = getDatabaseInstance();

      const contracts = await db.contract.findMany({
        where: {
          clientId,
          status: 'ACTIVE',
        },
        select: {
          id: true,
          contractNumber: true,
          directDebitSetup: true,
          directDebitConfirmed: true,
          signedContractReceived: true,
          contractUploaded: true,
          contractAddedToXero: true,
          contractSentToClient: true,
          dpaSignedGdpr: true,
          firstInvoiceSent: true,
          firstPaymentMade: true,
          paymentTermsAgreed: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
      });

      return {
        success: true,
        data: {
          client: {
            id: client.id,
            companyName: client.companyName,
            welcomeEmailSent: client.welcomeEmailSent,
          },
          contract: contracts[0] || null,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch onboarding data',
      };
    }
  }
);

/**
 * Update a single onboarding field
 */
export const updateOnboardingField = withAuth(
  async (
    _session,
    clientId: number,
    type: 'client' | 'contract',
    field: string,
    value: boolean
  ): Promise<{
    success: boolean;
    data?: {
      client: { id: number; companyName: string; welcomeEmailSent: boolean };
      contract: {
        id: number;
        contractNumber: string;
        directDebitSetup: boolean;
        directDebitConfirmed: boolean;
        signedContractReceived: boolean;
        contractUploaded: boolean;
        contractAddedToXero: boolean;
        contractSentToClient: boolean;
        dpaSignedGdpr: boolean;
        firstInvoiceSent: boolean;
        firstPaymentMade: boolean;
        paymentTermsAgreed: boolean;
      } | null;
    };
    error?: string;
  }> => {
    try {
      // TODO: Move this to a proper service method
      const { getDatabaseInstance } = await import('@/lib/database');
      const db = getDatabaseInstance();

      if (type === 'client') {
        // Validate field
        if (field !== 'welcomeEmailSent') {
          return {
            success: false,
            error: 'Invalid client field',
          };
        }

        // Update client field
        await db.client.update({
          where: { id: clientId },
          data: { welcomeEmailSent: value },
        });
      } else if (type === 'contract') {
        // Validate field
        const validFields = [
          'directDebitSetup',
          'directDebitConfirmed',
          'signedContractReceived',
          'contractUploaded',
          'contractAddedToXero',
          'contractSentToClient',
          'dpaSignedGdpr',
          'firstInvoiceSent',
          'firstPaymentMade',
          'paymentTermsAgreed',
        ];

        if (!validFields.includes(field)) {
          return {
            success: false,
            error: 'Invalid contract field',
          };
        }

        // Find active contract
        const client = await db.client.findUnique({
          where: { id: clientId },
          select: {
            contracts: {
              where: { status: 'ACTIVE' },
              take: 1,
            },
          },
        });

        if (!client || client.contracts.length === 0) {
          return {
            success: false,
            error: 'No active contract found',
          };
        }

        // Update contract field
        await db.contract.update({
          where: { id: client.contracts[0].id },
          data: { [field]: value },
        });
      } else {
        return {
          success: false,
          error: 'Invalid type',
        };
      }

      // Fetch updated data - need to call the wrapped action
      // Since we're already inside a withAuth wrapper, we can't call another wrapped action directly
      // We need to fetch the data manually here
      const updatedClient = await clientService.getClientById(clientId);

      if (!updatedClient) {
        return {
          success: false,
          error: 'Client not found',
        };
      }

      const updatedContracts = await db.contract.findMany({
        where: {
          clientId,
          status: 'ACTIVE',
        },
        select: {
          id: true,
          contractNumber: true,
          directDebitSetup: true,
          directDebitConfirmed: true,
          signedContractReceived: true,
          contractUploaded: true,
          contractAddedToXero: true,
          contractSentToClient: true,
          dpaSignedGdpr: true,
          firstInvoiceSent: true,
          firstPaymentMade: true,
          paymentTermsAgreed: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
      });

      return {
        success: true,
        data: {
          client: {
            id: updatedClient.id,
            companyName: updatedClient.companyName,
            welcomeEmailSent: updatedClient.welcomeEmailSent,
          },
          contract: updatedContracts[0] || null,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update onboarding field',
      };
    }
  }
);
