import { Client, PrismaClient } from '@prisma/client';

import { getDatabaseInstance } from '@/lib/database';
import { ValidationError, FieldValidationError, ClientNotFoundError } from '@/lib/errors';

import type {
  GetClientsParams,
  CreateClientDto,
  UpdateClientDto,
  ClientResponse,
} from '@/lib/types/client';

/**
 * ClientService - Business logic for client management
 *
 * Key patterns:
 * - Constructor dependency injection for database access
 * - Proper error handling with business errors
 * - Input validation
 * - Database transactions where needed
 */
export class ClientService {
  constructor(private readonly db: PrismaClient) {}

  /**
   * Get unique sectors from database
   * Used to populate sector dropdown
   */
  async getUniqueSectors(): Promise<string[]> {
    try {
      const sectors = await this.db.client.findMany({
        where: {
          sector: {
            not: null,
          },
        },
        select: {
          sector: true,
        },
        distinct: ['sector'],
        orderBy: {
          sector: 'asc',
        },
      });

      return sectors.map((s) => s.sector).filter((s): s is string => s !== null);
    } catch (error) {
      console.error('Error fetching unique sectors:', error);
      return [];
    }
  }

  /**
   * Update sector name across all clients
   * @param oldName - Current sector name
   * @param newName - New sector name
   * @returns Number of clients updated
   */
  async updateSector(oldName: string, newName: string): Promise<number> {
    // Validation
    if (!oldName || !oldName.trim()) {
      throw new ValidationError('Old sector name is required');
    }
    if (!newName || !newName.trim()) {
      throw new ValidationError('New sector name is required');
    }
    if (newName.length > 100) {
      throw new ValidationError('Sector name must be less than 100 characters');
    }

    const trimmedOld = oldName.trim();
    const trimmedNew = newName.trim();

    // Check if trying to rename to the same name
    if (trimmedOld.toLowerCase() === trimmedNew.toLowerCase()) {
      throw new ValidationError('New sector name must be different from the old name');
    }

    // Check if the new sector name already exists
    const existingSector = await this.db.client.findFirst({
      where: {
        sector: {
          equals: trimmedNew,
          mode: 'insensitive',
        },
      },
    });

    if (existingSector) {
      throw new ValidationError(`Sector "${trimmedNew}" already exists`);
    }

    // Update all clients with this sector
    const result = await this.db.client.updateMany({
      where: {
        sector: {
          equals: trimmedOld,
          mode: 'insensitive',
        },
      },
      data: {
        sector: trimmedNew,
      },
    });

    return result.count;
  }

  /**
   * Delete sector (set to null for all clients using it)
   * @param name - Sector name to delete
   * @returns Object with count of clients affected and whether deletion was successful
   */
  async deleteSector(name: string): Promise<{ count: number; deleted: boolean }> {
    // Validation
    if (!name || !name.trim()) {
      throw new ValidationError('Sector name is required');
    }

    const trimmedName = name.trim();

    // Count how many clients use this sector
    const clientCount = await this.db.client.count({
      where: {
        sector: {
          equals: trimmedName,
          mode: 'insensitive',
        },
      },
    });

    if (clientCount === 0) {
      // No clients use this sector, nothing to delete
      return { count: 0, deleted: false };
    }

    // Set sector to null for all clients using it
    const result = await this.db.client.updateMany({
      where: {
        sector: {
          equals: trimmedName,
          mode: 'insensitive',
        },
      },
      data: {
        sector: null,
      },
    });

    return { count: result.count, deleted: true };
  }

  /**
   * Get clients with search and pagination
   */
  async getClients(params: GetClientsParams): Promise<ClientResponse> {
    const { page = 1, limit = 25, search = '' } = params;

    // Validate pagination parameters
    if (page < 1) {
      throw new ValidationError('Page must be greater than 0');
    }
    if (limit < 1 || limit > 100) {
      throw new ValidationError('Limit must be between 1 and 100');
    }

    const offset = (page - 1) * limit;

    // Build search conditions
    const where = search
      ? {
          OR: [
            { companyName: { contains: search, mode: 'insensitive' as const } },
            { businessId: { contains: search, mode: 'insensitive' as const } },
            { sector: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    // Use transaction for consistency
    const [clients, totalCount] = await this.db.$transaction([
      this.db.client.findMany({
        where,
        orderBy: [
          { status: 'asc' },      // ACTIVE first, then INACTIVE, then PENDING
          { companyName: 'asc' }, // Alphabetical within each status
        ],
        take: limit,
        skip: offset,
        select: {
          id: true,
          clientType: true,
          companyName: true,
          businessId: true,
          sector: true,
          serviceTier: true,
          monthlyRetainer: true,
          contractStartDate: true,
          contractRenewalDate: true,
          status: true,
          welcomeEmailSent: true,
          externalAudit: true,
          paymentMethod: true,
          chargeVat: true,
          directDebitSetup: true,
          directDebitConfirmed: true,
          contractAddedToXero: true,
          recurringInvoiceSetup: true,
          dpaSignedGdpr: true,
          firstInvoiceSent: true,
          firstPaymentMade: true,
          lastPriceIncrease: true,
          createdBy: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.db.client.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      clients,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get a client by ID with contacts and active contract
   */
  async getClientById(id: number) {
    // Validate ID
    if (!id || id < 1) {
      throw new ValidationError('Invalid client ID');
    }

    const client = await this.db.client.findUnique({
      where: { id },
      include: {
        contacts: {
          orderBy: {
            type: 'asc', // SERVICE, INVOICE
          },
        },
        addresses: {
          orderBy: {
            type: 'asc', // SERVICE, INVOICE
          },
        },
        contracts: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        audits: {
          orderBy: {
            nextAuditDate: 'asc', // Show soonest audits first
          },
        },
      },
    });

    if (!client) {
      throw new ClientNotFoundError(id);
    }

    return client;
  }

  /**
   * Create a new client with new contact system
   */
  async createClient(data: CreateClientDto): Promise<Client> {
    // Validate required fields
    const errors = [];
    if (!data.companyName) {
      errors.push({ field: 'companyName', message: 'Company name is required' });
    }
    if (!data.serviceTier) {
      errors.push({ field: 'serviceTier', message: 'Service tier is required' });
    }

    // Validate contacts if provided
    if (data.contacts) {
      data.contacts.forEach((contact, index) => {
        if (!contact.name) {
          errors.push({ field: `contacts[${index}].name`, message: 'Contact name is required' });
        }
        if (!contact.email) {
          errors.push({ field: `contacts[${index}].email`, message: 'Contact email is required' });
        } else if (!this.isValidEmail(contact.email)) {
          errors.push({ field: `contacts[${index}].email`, message: 'Invalid email format' });
        }
      });
    }

    if (errors.length > 0) {
      throw new FieldValidationError(errors);
    }

    // Create client and contacts in a transaction
    const client = await this.db.$transaction(async (tx) => {
      // Conditional payment method onboarding fields
      // Set to null (N/A) for irrelevant payment methods, false (pending) for relevant ones
      let directDebitSetup: boolean | null = null;
      let directDebitConfirmed: boolean | null = null;
      let recurringInvoiceSetup: boolean | null = null;

      if (data.paymentMethod === 'DIRECT_DEBIT') {
        // Direct Debit selected - set DD fields to false (pending), Invoice to null (N/A)
        directDebitSetup = false;
        directDebitConfirmed = false;
        recurringInvoiceSetup = null;
      } else if (data.paymentMethod === 'INVOICE') {
        // Invoice selected - set Invoice fields to false (pending), DD to null (N/A)
        directDebitSetup = null;
        directDebitConfirmed = null;
        recurringInvoiceSetup = false;
      }
      // If paymentMethod is null/undefined, all remain null (N/A)

      // Create the client
      const newClient = await tx.client.create({
        data: {
          clientType: data.clientType || 'COMPANY',
          companyName: data.companyName,
          businessId: data.businessId || null,
          sector: data.sector || null,
          serviceTier: data.serviceTier,
          monthlyRetainer: data.monthlyRetainer || null,
          contractStartDate: data.contractStartDate || null,
          contractRenewalDate: data.contractRenewalDate || null,
          status: data.status || 'ACTIVE',
          externalAudit: data.externalAudit || false,
          paymentMethod: data.paymentMethod || null,
          chargeVat: data.chargeVat !== undefined ? data.chargeVat : true,
          // Conditional payment onboarding fields based on payment method
          directDebitSetup,
          directDebitConfirmed,
          recurringInvoiceSetup,
        },
      });

      // Create contacts from array (new system: SERVICE or INVOICE types)
      if (data.contacts && data.contacts.length > 0) {
        for (const contact of data.contacts) {
          await tx.clientContact.create({
            data: {
              clientId: newClient.id,
              type: contact.type,
              name: contact.name,
              email: contact.email,
              phone: contact.phone || null,
              role: contact.role || null,
              description: contact.description || null,
            },
          });
        }
      }

      // Create addresses from array (new system: SERVICE or INVOICE types)
      if (data.addresses && data.addresses.length > 0) {
        for (const address of data.addresses) {
          await tx.clientAddress.create({
            data: {
              clientId: newClient.id,
              type: address.type,
              addressLine1: address.addressLine1,
              addressLine2: address.addressLine2 || null,
              city: address.city,
              postcode: address.postcode,
              country: address.country,
              description: address.description || null,
            },
          });
        }
      }

      // Create client audit records if external audit is enabled
      if (data.externalAudit) {
        // Use new auditRecords array if provided, otherwise fall back to legacy single audit fields
        if (data.auditRecords && data.auditRecords.length > 0) {
          for (const auditRecord of data.auditRecords) {
            await tx.clientAudit.create({
              data: {
                clientId: newClient.id,
                auditedBy: auditRecord.auditedBy,
                interval: auditRecord.auditInterval,
                nextAuditDate: auditRecord.nextAuditDate,
              },
            });
          }
        } else if (data.auditedBy && data.auditInterval && data.nextAuditDate) {
          // Legacy single audit record support
          await tx.clientAudit.create({
            data: {
              clientId: newClient.id,
              auditedBy: data.auditedBy,
              interval: data.auditInterval,
              nextAuditDate: data.nextAuditDate,
            },
          });
        }
      }

      // Create contract record with service agreement details
      // Generate contract number: CON-{batch}-{record}
      // Batch 001 can hold 999 contracts (CON-001-001 to CON-001-999)
      // Then batch 002 starts (CON-002-001 to CON-002-999), etc.
      const contractCount = await tx.contract.count();
      const batch = Math.floor(contractCount / 999) + 1; // Start at batch 001
      const record = (contractCount % 999) + 1; // Record within batch (1-999)
      const contractNumber = `CON-${String(batch).padStart(3, '0')}-${String(record).padStart(3, '0')}`;
      const version = 1; // First contract is always version 1

      await tx.contract.create({
        data: {
          clientId: newClient.id,
          contractNumber,
          version,
          contractStartDate: data.contractStartDate || new Date(),
          contractRenewalDate: data.contractRenewalDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          status: 'ACTIVE',
          // Onboarding fields - all default to false via Prisma schema
          // Service Agreement - In Scope
          hrAdminInclusiveHours: data.hrAdminInclusiveHours || null,
          employmentLawInclusiveHours: data.employmentLawInclusiveHours || null,
          inclusiveServicesInScope: data.inclusiveServicesInScope || [],
          // Service Agreement - Out of Scope
          inclusiveServicesOutOfScope: data.inclusiveServicesOutOfScope || [],
          hrAdminRate: data.hrAdminRate || null,
          hrAdminRateUnit: data.hrAdminRateUnit || null,
          employmentLawRate: data.employmentLawRate || null,
          employmentLawRateUnit: data.employmentLawRateUnit || null,
          mileageRate: data.mileageRate || null,
          overnightRate: data.overnightRate || null,
        },
      });

      return newClient;
    });

    return client;
  }

  /**
   * Update a client
   */
  async updateClient(id: number, data: UpdateClientDto): Promise<Client> {
    // Validate ID
    if (!id || id < 1) {
      throw new ValidationError('Invalid client ID');
    }

    // Check if client exists
    const existingClient = await this.db.client.findUnique({
      where: { id },
    });

    if (!existingClient) {
      throw new ClientNotFoundError(id);
    }

    // Validate required fields if provided
    const errors = [];
    if (data.companyName !== undefined && !data.companyName) {
      errors.push({ field: 'companyName', message: 'Company name cannot be empty' });
    }
    if (data.serviceTier !== undefined && !data.serviceTier) {
      errors.push({ field: 'serviceTier', message: 'Service tier cannot be empty' });
    }

    if (errors.length > 0) {
      throw new FieldValidationError(errors);
    }

    // Update client
    const client = await this.db.client.update({
      where: { id },
      data: {
        clientType: data.clientType,
        companyName: data.companyName,
        businessId: data.businessId !== undefined ? data.businessId : undefined,
        sector: data.sector !== undefined ? data.sector : undefined,
        serviceTier: data.serviceTier,
        monthlyRetainer: data.monthlyRetainer !== undefined ? data.monthlyRetainer : undefined,
        contractStartDate:
          data.contractStartDate !== undefined ? data.contractStartDate : undefined,
        contractRenewalDate:
          data.contractRenewalDate !== undefined ? data.contractRenewalDate : undefined,
        status: data.status,
        chargeVat: data.chargeVat !== undefined ? data.chargeVat : undefined,
        paymentMethod: data.paymentMethod !== undefined ? data.paymentMethod : undefined,
        directDebitSetup: data.directDebitSetup !== undefined ? data.directDebitSetup : undefined,
        directDebitConfirmed: data.directDebitConfirmed !== undefined ? data.directDebitConfirmed : undefined,
        contractAddedToXero: data.contractAddedToXero !== undefined ? data.contractAddedToXero : undefined,
        recurringInvoiceSetup: data.recurringInvoiceSetup !== undefined ? data.recurringInvoiceSetup : undefined,
        dpaSignedGdpr: data.dpaSignedGdpr !== undefined ? data.dpaSignedGdpr : undefined,
        firstInvoiceSent: data.firstInvoiceSent !== undefined ? data.firstInvoiceSent : undefined,
        firstPaymentMade: data.firstPaymentMade !== undefined ? data.firstPaymentMade : undefined,
        lastPriceIncrease: data.lastPriceIncrease !== undefined ? data.lastPriceIncrease : undefined,
        externalAudit: data.externalAudit !== undefined ? data.externalAudit : undefined,
      },
    });

    return client;
  }

  /**
   * Toggle client status (deactivate ACTIVE clients, reactivate INACTIVE/PENDING clients)
   * @param id - Client ID
   * @param targetStatus - Optional target status for ACTIVE clients (PENDING or INACTIVE)
   */
  async deleteClient(id: number, targetStatus?: 'PENDING' | 'INACTIVE'): Promise<Client> {
    // Validate ID
    if (!id || id < 1) {
      throw new ValidationError('Invalid client ID');
    }

    // Check if client exists
    const existingClient = await this.db.client.findUnique({
      where: { id },
    });

    if (!existingClient) {
      throw new ClientNotFoundError(id);
    }

    // Determine new status
    let newStatus: 'ACTIVE' | 'PENDING' | 'INACTIVE';
    if (existingClient.status === 'ACTIVE') {
      // ACTIVE client being deactivated - use targetStatus if provided, default to INACTIVE
      newStatus = targetStatus || 'INACTIVE';
    } else {
      // PENDING or INACTIVE client being activated
      newStatus = 'ACTIVE';
    }

    const client = await this.db.client.update({
      where: { id },
      data: {
        status: newStatus,
      },
    });

    return client;
  }

  /**
   * Private helper: Validate email format
   */
  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}

// Singleton instance export with environment-specific database
export const clientService = new ClientService(getDatabaseInstance());
