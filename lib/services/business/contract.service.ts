import { Contract, ContractStatus, PrismaClient } from '@prisma/client';

import { getDatabaseInstance } from '@/lib/database';
import { ValidationError } from '@/lib/errors';

import type { CreateContractDto, UpdateContractDto } from '@/lib/types/contract';

/**
 * ContractService - Business logic for contract management
 *
 * Key patterns:
 * - Constructor dependency injection for database access
 * - Proper error handling with business errors
 * - Input validation
 * - Database transactions where needed
 */
export class ContractService {
  constructor(private readonly db: PrismaClient) {}

  /**
   * Get all contracts for a client
   * Optionally filter by status
   */
  async getClientContracts(clientId: number, filters?: { status?: ContractStatus }): Promise<Contract[]> {
    return this.db.contract.findMany({
      where: {
        clientId,
        ...(filters?.status && { status: filters.status }),
      },
      orderBy: [
        { status: 'asc' }, // ACTIVE first, then DRAFT, then ARCHIVED
        { version: 'desc' }, // Newest version first
      ],
    });
  }

  /**
   * Get single contract by ID with full details
   */
  async getContractById(id: number): Promise<Contract | null> {
    if (!id || id < 1) {
      throw new ValidationError('Invalid contract ID');
    }

    return this.db.contract.findUnique({
      where: { id },
    });
  }

  /**
   * Check if client has any active contracts
   */
  async hasActiveContract(clientId: number): Promise<boolean> {
    const count = await this.db.contract.count({
      where: {
        clientId,
        status: 'ACTIVE',
      },
    });

    return count > 0;
  }

  /**
   * Get active contract for a client
   */
  async getActiveContract(clientId: number): Promise<Contract | null> {
    return this.db.contract.findFirst({
      where: {
        clientId,
        status: 'ACTIVE',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Create a new contract
   * If replaceExisting is true, archives all active contracts for the client
   */
  async createContract(data: CreateContractDto): Promise<Contract> {
    // Validate required fields
    const errors = [];
    if (!data.clientId) {
      errors.push({ field: 'clientId', message: 'Client ID is required' });
    }
    if (!data.contractStartDate) {
      errors.push({ field: 'contractStartDate', message: 'Contract start date is required' });
    }
    if (!data.contractRenewalDate) {
      errors.push({ field: 'contractRenewalDate', message: 'Contract renewal date is required' });
    }

    if (errors.length > 0) {
      throw new ValidationError('Missing required fields');
    }

    // Validate that renewal date is after start date
    if (
      data.contractStartDate &&
      data.contractRenewalDate &&
      new Date(data.contractRenewalDate) <= new Date(data.contractStartDate)
    ) {
      throw new ValidationError('Contract renewal date must be after start date');
    }

    // Create contract in a transaction
    const contract = await this.db.$transaction(async (tx) => {
      // If replaceExisting is true, archive all active contracts for this client
      if (data.replaceExisting) {
        await tx.contract.updateMany({
          where: {
            clientId: data.clientId,
            status: 'ACTIVE',
          },
          data: {
            status: 'ARCHIVED',
          },
        });
      }

      // Generate contract number and version
      // Format: CON-{officeId}-{paddedClientId}-{sequential}
      const officeId = 1; // Single office/branch
      const existingContracts = await tx.contract.count({
        where: {
          clientId: data.clientId,
        },
      });
      const paddedClientId = String(data.clientId).padStart(3, '0');
      const sequential = String(existingContracts + 1).padStart(3, '0');
      const contractNumber = `CON-${officeId}-${paddedClientId}-${sequential}`;

      // Version is based on total count of contracts for this client
      const version = existingContracts + 1;

      // Create the contract
      return tx.contract.create({
        data: {
          clientId: data.clientId,
          contractNumber,
          version,
          contractStartDate: data.contractStartDate,
          contractRenewalDate: data.contractRenewalDate,
          status: data.status || 'ACTIVE',
          hrAdminInclusiveHours: data.hrAdminInclusiveHours || null,
          hrAdminInclusiveHoursPeriod: data.hrAdminInclusiveHoursPeriod || null,
          employmentLawInclusiveHours: data.employmentLawInclusiveHours || null,
          employmentLawInclusiveHoursPeriod: data.employmentLawInclusiveHoursPeriod || null,
          inclusiveServicesInScope: data.inclusiveServicesInScope || [],
          inclusiveServicesOutOfScope: data.inclusiveServicesOutOfScope || [],
          hrAdminRate: data.hrAdminRate || null,
          hrAdminRateUnit: data.hrAdminRateUnit || null,
          employmentLawRate: data.employmentLawRate || null,
          employmentLawRateUnit: data.employmentLawRateUnit || null,
          mileageRate: data.mileageRate || null,
          overnightRate: data.overnightRate || null,
          // All onboarding fields default to false via Prisma schema
        },
      });
    });

    return contract;
  }

  /**
   * Update a contract
   */
  async updateContract(id: number, data: UpdateContractDto): Promise<Contract> {
    // Validate ID
    if (!id || id < 1) {
      throw new ValidationError('Invalid contract ID');
    }

    // Check if contract exists
    const existingContract = await this.db.contract.findUnique({
      where: { id },
    });

    if (!existingContract) {
      throw new ValidationError('Contract not found');
    }

    // Validate that renewal date is after start date if both provided
    if (data.contractStartDate && data.contractRenewalDate) {
      if (new Date(data.contractRenewalDate) <= new Date(data.contractStartDate)) {
        throw new ValidationError('Contract renewal date must be after start date');
      }
    }

    // Update contract
    const contract = await this.db.contract.update({
      where: { id },
      data: {
        contractStartDate: data.contractStartDate,
        contractRenewalDate: data.contractRenewalDate,
        status: data.status,
        hrAdminInclusiveHours: data.hrAdminInclusiveHours !== undefined ? data.hrAdminInclusiveHours : undefined,
        hrAdminInclusiveHoursPeriod:
          data.hrAdminInclusiveHoursPeriod !== undefined ? data.hrAdminInclusiveHoursPeriod : undefined,
        employmentLawInclusiveHours:
          data.employmentLawInclusiveHours !== undefined ? data.employmentLawInclusiveHours : undefined,
        employmentLawInclusiveHoursPeriod:
          data.employmentLawInclusiveHoursPeriod !== undefined ? data.employmentLawInclusiveHoursPeriod : undefined,
        inclusiveServicesInScope:
          data.inclusiveServicesInScope !== undefined ? data.inclusiveServicesInScope : undefined,
        inclusiveServicesOutOfScope:
          data.inclusiveServicesOutOfScope !== undefined ? data.inclusiveServicesOutOfScope : undefined,
        hrAdminRate: data.hrAdminRate !== undefined ? data.hrAdminRate : undefined,
        hrAdminRateUnit: data.hrAdminRateUnit !== undefined ? data.hrAdminRateUnit : undefined,
        employmentLawRate: data.employmentLawRate !== undefined ? data.employmentLawRate : undefined,
        employmentLawRateUnit: data.employmentLawRateUnit !== undefined ? data.employmentLawRateUnit : undefined,
        mileageRate: data.mileageRate !== undefined ? data.mileageRate : undefined,
        overnightRate: data.overnightRate !== undefined ? data.overnightRate : undefined,
      },
    });

    return contract;
  }

  /**
   * Update contract services in scope
   */
  async updateServicesInScope(id: number, services: string[]): Promise<Contract> {
    // Validate ID
    if (!id || id < 1) {
      throw new ValidationError('Invalid contract ID');
    }

    // Check if contract exists
    const existingContract = await this.db.contract.findUnique({
      where: { id },
    });

    if (!existingContract) {
      throw new ValidationError('Contract not found');
    }

    // Update services
    const contract = await this.db.contract.update({
      where: { id },
      data: {
        inclusiveServicesInScope: services,
      },
    });

    return contract;
  }

  /**
   * Update contract services out of scope
   */
  async updateServicesOutOfScope(id: number, services: string[]): Promise<Contract> {
    // Validate ID
    if (!id || id < 1) {
      throw new ValidationError('Invalid contract ID');
    }

    // Check if contract exists
    const existingContract = await this.db.contract.findUnique({
      where: { id },
    });

    if (!existingContract) {
      throw new ValidationError('Contract not found');
    }

    // Update services
    const contract = await this.db.contract.update({
      where: { id },
      data: {
        inclusiveServicesOutOfScope: services,
      },
    });

    return contract;
  }

  /**
   * Set a contract as active
   * Archives the current active contract (if any) before setting the new one as active
   * Business rule: Only one ACTIVE contract per client at any time
   */
  async setActiveContract(clientId: number, contractId: number): Promise<Contract> {
    // Validate IDs
    if (!clientId || clientId < 1) {
      throw new ValidationError('Invalid client ID');
    }
    if (!contractId || contractId < 1) {
      throw new ValidationError('Invalid contract ID');
    }

    // Check if target contract exists and belongs to this client
    const targetContract = await this.db.contract.findUnique({
      where: { id: contractId },
    });

    if (!targetContract) {
      throw new ValidationError('Contract not found');
    }

    if (targetContract.clientId !== clientId) {
      throw new ValidationError('Contract does not belong to this client');
    }

    // Cannot set DRAFT contracts as ACTIVE
    if (targetContract.status === 'DRAFT') {
      throw new ValidationError('Cannot set DRAFT contracts as ACTIVE. Please complete the contract first.');
    }

    // If already active, return as-is
    if (targetContract.status === 'ACTIVE') {
      return targetContract;
    }

    // Use transaction to ensure atomic operation
    const updatedContract = await this.db.$transaction(async (tx) => {
      // Archive all current ACTIVE contracts for this client
      await tx.contract.updateMany({
        where: {
          clientId,
          status: 'ACTIVE',
        },
        data: {
          status: 'ARCHIVED',
        },
      });

      // Set the target contract as ACTIVE
      const contract = await tx.contract.update({
        where: { id: contractId },
        data: {
          status: 'ACTIVE',
        },
      });

      return contract;
    });

    // Validate business rule: only one ACTIVE contract per client
    const activeCount = await this.db.contract.count({
      where: {
        clientId,
        status: 'ACTIVE',
      },
    });

    if (activeCount !== 1) {
      throw new Error(`Invalid state: Client ${clientId} has ${activeCount} active contracts`);
    }

    return updatedContract;
  }

  /**
   * Delete a contract
   * Business rule: Only DRAFT contracts can be deleted
   */
  async deleteContract(id: number): Promise<void> {
    // Validate ID
    if (!id || id < 1) {
      throw new ValidationError('Invalid contract ID');
    }

    // Check if contract exists
    const existingContract = await this.db.contract.findUnique({
      where: { id },
    });

    if (!existingContract) {
      throw new ValidationError('Contract not found');
    }

    // Only DRAFT contracts can be deleted
    if (existingContract.status !== 'DRAFT') {
      throw new ValidationError(
        'Cannot delete contracts that are not in DRAFT status. Only DRAFT contracts can be deleted.'
      );
    }

    // Delete the contract
    await this.db.contract.delete({
      where: { id },
    });
  }

  /**
   * Update contract document URLs
   */
  async updateUrls(
    id: number,
    urls: { docUrl?: string; signedContractUrl?: string }
  ): Promise<Contract> {
    // Validate ID
    if (!id || id < 1) {
      throw new ValidationError('Invalid contract ID');
    }

    // Check if contract exists
    const existingContract = await this.db.contract.findUnique({
      where: { id },
    });

    if (!existingContract) {
      throw new ValidationError('Contract not found');
    }

    // Update URLs
    const contract = await this.db.contract.update({
      where: { id },
      data: {
        docUrl: urls.docUrl !== undefined ? urls.docUrl : undefined,
        signedContractUrl: urls.signedContractUrl !== undefined ? urls.signedContractUrl : undefined,
      },
    });

    return contract;
  }
}

// Singleton instance export with environment-specific database
export const contractService = new ContractService(getDatabaseInstance());
