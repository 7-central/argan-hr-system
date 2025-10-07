'use server';

import { revalidatePath } from 'next/cache';

import { ContractStatus } from '@prisma/client';

import { withAuth } from '@/lib/server-actions/with-auth';
import { contractService } from '@/lib/services/business/contract.service';

import type { Contract, CreateContractDto, UpdateContractDto } from '@/lib/types/contract';

/**
 * Contract Management Server Actions
 * All actions require authentication via withAuth wrapper
 */

/**
 * Check if a client has any active contracts
 */
export const checkActiveContract = withAuth(
  async (
    _session,
    clientId: number
  ): Promise<{ success: boolean; hasActive: boolean; error?: string }> => {
    try {
      const hasActive = await contractService.hasActiveContract(clientId);

      return {
        success: true,
        hasActive,
      };
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          hasActive: false,
          error: error.message,
        };
      }

      return {
        success: false,
        hasActive: false,
        error: 'An unexpected error occurred while checking for active contracts',
      };
    }
  }
);

/**
 * Create new contract with proper error handling
 * Returns result object (not throwing errors) following architectural patterns
 */
export const createContract = withAuth(
  async (
    _session,
    data: CreateContractDto
  ): Promise<{ success: boolean; data?: Contract; error?: string }> => {
    try {
      const contract = await contractService.createContract(data);

      // Convert Decimal to number for client serialization
      const serializedContract = {
        ...contract,
        hrAdminInclusiveHours: contract.hrAdminInclusiveHours
          ? Number(contract.hrAdminInclusiveHours)
          : null,
        employmentLawInclusiveHours: contract.employmentLawInclusiveHours
          ? Number(contract.employmentLawInclusiveHours)
          : null,
        hrAdminRate: contract.hrAdminRate ? Number(contract.hrAdminRate) : null,
        employmentLawRate: contract.employmentLawRate ? Number(contract.employmentLawRate) : null,
        mileageRate: contract.mileageRate ? Number(contract.mileageRate) : null,
        overnightRate: contract.overnightRate ? Number(contract.overnightRate) : null,
      };

      return {
        success: true,
        data: serializedContract,
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
        error: 'An unexpected error occurred while creating the contract',
      };
    }
  }
);

/**
 * Update existing contract with proper error handling
 * Returns result object (not throwing errors) following architectural patterns
 */
export const updateContract = withAuth(
  async (
    _session,
    id: number,
    data: UpdateContractDto
  ): Promise<{ success: boolean; data?: Contract; error?: string }> => {
    try {
      const contract = await contractService.updateContract(id, data);

      // Convert Decimal to number for client serialization
      const serializedContract = {
        ...contract,
        hrAdminInclusiveHours: contract.hrAdminInclusiveHours
          ? Number(contract.hrAdminInclusiveHours)
          : null,
        employmentLawInclusiveHours: contract.employmentLawInclusiveHours
          ? Number(contract.employmentLawInclusiveHours)
          : null,
        hrAdminRate: contract.hrAdminRate ? Number(contract.hrAdminRate) : null,
        employmentLawRate: contract.employmentLawRate ? Number(contract.employmentLawRate) : null,
        mileageRate: contract.mileageRate ? Number(contract.mileageRate) : null,
        overnightRate: contract.overnightRate ? Number(contract.overnightRate) : null,
      };

      return {
        success: true,
        data: serializedContract,
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
        error: 'An unexpected error occurred while updating the contract',
      };
    }
  }
);

/**
 * Get all contracts for a client
 * Optionally filter by status
 */
export const getClientContracts = withAuth(
  async (
    _session,
    clientId: number,
    filters?: { status?: ContractStatus }
  ): Promise<{ success: boolean; data?: Contract[]; error?: string }> => {
    try {
      const contracts = await contractService.getClientContracts(clientId, filters);

      // Serialize Decimal fields for all contracts
      const serializedContracts = contracts.map((contract) => ({
        ...contract,
        hrAdminInclusiveHours: contract.hrAdminInclusiveHours
          ? Number(contract.hrAdminInclusiveHours)
          : null,
        employmentLawInclusiveHours: contract.employmentLawInclusiveHours
          ? Number(contract.employmentLawInclusiveHours)
          : null,
        hrAdminRate: contract.hrAdminRate ? Number(contract.hrAdminRate) : null,
        employmentLawRate: contract.employmentLawRate ? Number(contract.employmentLawRate) : null,
        mileageRate: contract.mileageRate ? Number(contract.mileageRate) : null,
        overnightRate: contract.overnightRate ? Number(contract.overnightRate) : null,
      }));

      return {
        success: true,
        data: serializedContracts,
      };
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: false,
        error: 'An unexpected error occurred while fetching contracts',
      };
    }
  }
);

/**
 * Get single contract by ID with full details
 */
export const getContract = withAuth(
  async (
    _session,
    contractId: number
  ): Promise<{ success: boolean; data?: Contract; error?: string }> => {
    try {
      const contract = await contractService.getContractById(contractId);

      if (!contract) {
        return {
          success: false,
          error: 'Contract not found',
        };
      }

      // Serialize Decimal fields
      const serializedContract = {
        ...contract,
        hrAdminInclusiveHours: contract.hrAdminInclusiveHours
          ? Number(contract.hrAdminInclusiveHours)
          : null,
        employmentLawInclusiveHours: contract.employmentLawInclusiveHours
          ? Number(contract.employmentLawInclusiveHours)
          : null,
        hrAdminRate: contract.hrAdminRate ? Number(contract.hrAdminRate) : null,
        employmentLawRate: contract.employmentLawRate ? Number(contract.employmentLawRate) : null,
        mileageRate: contract.mileageRate ? Number(contract.mileageRate) : null,
        overnightRate: contract.overnightRate ? Number(contract.overnightRate) : null,
      };

      return {
        success: true,
        data: serializedContract,
      };
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: false,
        error: 'An unexpected error occurred while fetching the contract',
      };
    }
  }
);

/**
 * Set a contract as active
 * Archives the current active contract before setting the new one
 */
export const setActiveContract = withAuth(
  async (
    _session,
    clientId: number,
    contractId: number
  ): Promise<{ success: boolean; data?: Contract; error?: string }> => {
    try {
      const contract = await contractService.setActiveContract(clientId, contractId);

      // Serialize Decimal fields
      const serializedContract = {
        ...contract,
        hrAdminInclusiveHours: contract.hrAdminInclusiveHours
          ? Number(contract.hrAdminInclusiveHours)
          : null,
        employmentLawInclusiveHours: contract.employmentLawInclusiveHours
          ? Number(contract.employmentLawInclusiveHours)
          : null,
        hrAdminRate: contract.hrAdminRate ? Number(contract.hrAdminRate) : null,
        employmentLawRate: contract.employmentLawRate ? Number(contract.employmentLawRate) : null,
        mileageRate: contract.mileageRate ? Number(contract.mileageRate) : null,
        overnightRate: contract.overnightRate ? Number(contract.overnightRate) : null,
      };

      // Revalidate contracts list page
      revalidatePath(`/admin/clients/${clientId}/contracts`);
      revalidatePath(`/admin/clients/${clientId}`);

      return {
        success: true,
        data: serializedContract,
      };
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: false,
        error: 'An unexpected error occurred while setting the contract as active',
      };
    }
  }
);

/**
 * Delete a contract
 * Only DRAFT contracts can be deleted
 */
export const deleteContract = withAuth(
  async (
    _session,
    clientId: number,
    contractId: number
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await contractService.deleteContract(contractId);

      // Revalidate contracts list page
      revalidatePath(`/admin/clients/${clientId}/contracts`);
      revalidatePath(`/admin/clients/${clientId}`);

      return {
        success: true,
      };
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: false,
        error: 'An unexpected error occurred while deleting the contract',
      };
    }
  }
);

/**
 * Update contract document URLs
 */
export const updateContractUrls = withAuth(
  async (
    _session,
    contractId: number,
    urls: { docUrl?: string; signedContractUrl?: string }
  ): Promise<{ success: boolean; data?: Contract; error?: string }> => {
    try {
      const contract = await contractService.updateUrls(contractId, urls);

      // Serialize Decimal fields
      const serializedContract = {
        ...contract,
        hrAdminInclusiveHours: contract.hrAdminInclusiveHours
          ? Number(contract.hrAdminInclusiveHours)
          : null,
        employmentLawInclusiveHours: contract.employmentLawInclusiveHours
          ? Number(contract.employmentLawInclusiveHours)
          : null,
        hrAdminRate: contract.hrAdminRate ? Number(contract.hrAdminRate) : null,
        employmentLawRate: contract.employmentLawRate ? Number(contract.employmentLawRate) : null,
        mileageRate: contract.mileageRate ? Number(contract.mileageRate) : null,
        overnightRate: contract.overnightRate ? Number(contract.overnightRate) : null,
      };

      // Revalidate contract detail page
      revalidatePath(`/admin/clients/${contract.clientId}/contracts/${contractId}`);
      revalidatePath(`/admin/clients/${contract.clientId}/contracts`);

      return {
        success: true,
        data: serializedContract,
      };
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: false,
        error: 'An unexpected error occurred while updating contract URLs',
      };
    }
  }
);
