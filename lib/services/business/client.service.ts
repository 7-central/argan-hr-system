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
          where: {
            status: 'ACTIVE',
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1, // Get most recent active contract
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

      // Create client audit record if external audit is enabled
      if (data.externalAudit && data.auditedBy && data.auditInterval && data.nextAuditDate) {
        await tx.clientAudit.create({
          data: {
            clientId: newClient.id,
            auditedBy: data.auditedBy,
            interval: data.auditInterval,
            nextAuditDate: data.nextAuditDate,
          },
        });
      }

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
   * Soft delete a client
   */
  async deleteClient(id: number): Promise<Client> {
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

    // Soft delete by setting status to INACTIVE
    const client = await this.db.client.update({
      where: { id },
      data: {
        status: 'INACTIVE',
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
