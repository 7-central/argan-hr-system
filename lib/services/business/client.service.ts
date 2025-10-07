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
            { contactEmail: { contains: search, mode: 'insensitive' as const } },
            { contactName: { contains: search, mode: 'insensitive' as const } },
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
          companyName: true,
          businessId: true,
          sector: true,
          serviceTier: true,
          monthlyRetainer: true,
          contactName: true,
          contactEmail: true,
          contactPhone: true,
          addressLine1: true,
          addressLine2: true,
          city: true,
          postcode: true,
          country: true,
          contractStartDate: true,
          contractRenewalDate: true,
          status: true,
          welcomeEmailSent: true,
          externalAudit: true,
          paymentMethod: true,
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
            type: 'asc', // PRIMARY, SECONDARY, INVOICE
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
   * Create a new client
   */
  async createClient(data: CreateClientDto): Promise<Client> {
    // Validate required fields
    const errors = [];
    if (!data.companyName) {
      errors.push({ field: 'companyName', message: 'Company name is required' });
    }
    if (!data.contactName) {
      errors.push({ field: 'contactName', message: 'Contact name is required' });
    }
    if (!data.contactEmail) {
      errors.push({ field: 'contactEmail', message: 'Contact email is required' });
    } else if (!this.isValidEmail(data.contactEmail)) {
      errors.push({ field: 'contactEmail', message: 'Invalid email format' });
    }
    if (!data.serviceTier) {
      errors.push({ field: 'serviceTier', message: 'Service tier is required' });
    }

    if (errors.length > 0) {
      throw new FieldValidationError(errors);
    }

    // Check for duplicate email
    await this.checkDuplicateEmail(data.contactEmail);

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
          companyName: data.companyName,
          businessId: data.businessId || null,
          sector: data.sector || null,
          serviceTier: data.serviceTier,
          monthlyRetainer: data.monthlyRetainer || null,
          contactName: data.contactName,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone || null,
          addressLine1: data.addressLine1 || null,
          addressLine2: data.addressLine2 || null,
          city: data.city || null,
          postcode: data.postcode || null,
          country: data.country || null,
          contractStartDate: data.contractStartDate || null,
          contractRenewalDate: data.contractRenewalDate || null,
          status: data.status || 'ACTIVE',
          externalAudit: data.externalAudit || false,
          paymentMethod: data.paymentMethod || null,
          // Conditional payment onboarding fields based on payment method
          directDebitSetup,
          directDebitConfirmed,
          recurringInvoiceSetup,
        },
      });

      // Create primary contact
      await tx.clientContact.create({
        data: {
          clientId: newClient.id,
          name: data.contactName,
          email: data.contactEmail,
          phone: data.contactPhone || null,
          role: data.contactRole || null,
          type: 'PRIMARY',
        },
      });

      // Create secondary contact if provided
      if (data.secondaryContactName && data.secondaryContactEmail) {
        await tx.clientContact.create({
          data: {
            clientId: newClient.id,
            name: data.secondaryContactName,
            email: data.secondaryContactEmail,
            phone: data.secondaryContactPhone || null,
            role: data.secondaryContactRole || null,
            type: 'SECONDARY',
          },
        });
      }

      // Create invoice contact if provided
      if (data.invoiceContactName && data.invoiceContactEmail) {
        await tx.clientContact.create({
          data: {
            clientId: newClient.id,
            name: data.invoiceContactName,
            email: data.invoiceContactEmail,
            phone: data.invoiceContactPhone || null,
            role: data.invoiceContactRole || null,
            type: 'INVOICE',
          },
        });
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
      // Generate contract number and version (this is the first contract, so version = 1)
      const year = new Date().getFullYear();
      const contractNumber = `CON-${newClient.id}-${year}-001`;
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
    if (data.contactName !== undefined && !data.contactName) {
      errors.push({ field: 'contactName', message: 'Contact name cannot be empty' });
    }
    if (data.contactEmail !== undefined) {
      if (!data.contactEmail) {
        errors.push({ field: 'contactEmail', message: 'Contact email cannot be empty' });
      } else if (!this.isValidEmail(data.contactEmail)) {
        errors.push({ field: 'contactEmail', message: 'Invalid email format' });
      }
    }
    if (data.serviceTier !== undefined && !data.serviceTier) {
      errors.push({ field: 'serviceTier', message: 'Service tier cannot be empty' });
    }

    if (errors.length > 0) {
      throw new FieldValidationError(errors);
    }

    // Check for duplicate email if email is being changed
    if (data.contactEmail && data.contactEmail !== existingClient.contactEmail) {
      await this.checkDuplicateEmail(data.contactEmail, id);
    }

    // Update client
    const client = await this.db.client.update({
      where: { id },
      data: {
        companyName: data.companyName,
        businessId: data.businessId !== undefined ? data.businessId : undefined,
        sector: data.sector !== undefined ? data.sector : undefined,
        serviceTier: data.serviceTier,
        monthlyRetainer: data.monthlyRetainer !== undefined ? data.monthlyRetainer : undefined,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone !== undefined ? data.contactPhone : undefined,
        addressLine1: data.addressLine1 !== undefined ? data.addressLine1 : undefined,
        addressLine2: data.addressLine2 !== undefined ? data.addressLine2 : undefined,
        city: data.city !== undefined ? data.city : undefined,
        postcode: data.postcode !== undefined ? data.postcode : undefined,
        country: data.country !== undefined ? data.country : undefined,
        contractStartDate:
          data.contractStartDate !== undefined ? data.contractStartDate : undefined,
        contractRenewalDate:
          data.contractRenewalDate !== undefined ? data.contractRenewalDate : undefined,
        status: data.status,
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

  /**
   * Private helper: Check for duplicate email
   */
  private async checkDuplicateEmail(email: string, excludeId?: number): Promise<void> {
    const existingClient = await this.db.client.findFirst({
      where: {
        contactEmail: email,
        status: 'ACTIVE',
        ...(excludeId && { id: { not: excludeId } }),
      },
    });

    if (existingClient) {
      const message = excludeId
        ? `Another client with email ${email} already exists`
        : `A client with email ${email} already exists`;
      throw new ValidationError(message);
    }
  }
}

// Singleton instance export with environment-specific database
export const clientService = new ClientService(getDatabaseInstance());
