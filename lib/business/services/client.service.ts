import { PrismaClient, Client } from '@prisma/client'
import { prisma } from '@/lib/system/database'
import {
  ValidationError,
  FieldValidationError,
  ClientNotFoundError,
} from '@/lib/business/errors'

// Input validation schemas
export interface GetClientsParams {
  page?: number
  limit?: number
  search?: string
}

export interface CreateClientDto {
  companyName: string
  businessId?: string
  sector?: string
  serviceTier: 'TIER_1' | 'DOC_ONLY' | 'AD_HOC'
  monthlyRetainer?: number
  contactName: string
  contactEmail: string
  contactPhone?: string
  contractStartDate?: Date
  contractRenewalDate?: Date
  status?: 'ACTIVE' | 'INACTIVE' | 'PENDING'
  createdBy: string
}

export interface UpdateClientDto {
  companyName?: string
  businessId?: string
  sector?: string
  serviceTier?: 'TIER_1' | 'DOC_ONLY' | 'AD_HOC'
  monthlyRetainer?: number
  contactName?: string
  contactEmail?: string
  contactPhone?: string
  contractStartDate?: Date
  contractRenewalDate?: Date
  status?: 'ACTIVE' | 'INACTIVE' | 'PENDING'
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    totalCount: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface ClientResponse {
  clients: Client[]
  pagination: {
    page: number
    limit: number
    totalCount: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

/**
 * ClientService - Business logic for client management
 *
 * Following document-parser patterns:
 * - Constructor dependency injection
 * - Proper error handling with business errors
 * - Input validation
 * - Database transactions where needed
 */
export class ClientService {
  constructor(private readonly db: PrismaClient) {}

  /**
   * Get clients with search and pagination
   */
  async getClients(params: GetClientsParams): Promise<ClientResponse> {
    const { page = 1, limit = 25, search = '' } = params

    // Validate pagination parameters
    if (page < 1) {
      throw new ValidationError('Page must be greater than 0')
    }
    if (limit < 1 || limit > 100) {
      throw new ValidationError('Limit must be between 1 and 100')
    }

    const offset = (page - 1) * limit

    // Build search conditions
    const where = search
      ? {
          OR: [
            { companyName: { contains: search, mode: 'insensitive' as const } },
            { contactEmail: { contains: search, mode: 'insensitive' as const } },
            { contactName: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}

    // Use transaction for consistency
    const [clients, totalCount] = await this.db.$transaction([
      this.db.client.findMany({
        where,
        orderBy: { createdAt: 'desc' },
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
          contractStartDate: true,
          contractRenewalDate: true,
          status: true,
          createdBy: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.db.client.count({ where }),
    ])

    const totalPages = Math.ceil(totalCount / limit)

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
    }
  }

  /**
   * Get a client by ID
   */
  async getClientById(id: string): Promise<Client> {
    // Validate ID format
    if (!id || id.length < 10) {
      throw new ValidationError('Invalid client ID format')
    }

    const client = await this.db.client.findUnique({
      where: { id },
    })

    if (!client) {
      throw new ClientNotFoundError(id)
    }

    return client
  }

  /**
   * Create a new client
   */
  async createClient(data: CreateClientDto): Promise<Client> {
    // Validate required fields
    const errors = []
    if (!data.companyName) {
      errors.push({ field: 'companyName', message: 'Company name is required' })
    }
    if (!data.contactName) {
      errors.push({ field: 'contactName', message: 'Contact name is required' })
    }
    if (!data.contactEmail) {
      errors.push({ field: 'contactEmail', message: 'Contact email is required' })
    } else if (!this.isValidEmail(data.contactEmail)) {
      errors.push({ field: 'contactEmail', message: 'Invalid email format' })
    }
    if (!data.serviceTier) {
      errors.push({ field: 'serviceTier', message: 'Service tier is required' })
    }

    if (errors.length > 0) {
      throw new FieldValidationError(errors)
    }

    // Check for duplicate email
    await this.checkDuplicateEmail(data.contactEmail)

    // Create client
    const client = await this.db.client.create({
      data: {
        companyName: data.companyName,
        businessId: data.businessId || null,
        sector: data.sector || null,
        serviceTier: data.serviceTier,
        monthlyRetainer: data.monthlyRetainer || null,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone || null,
        contractStartDate: data.contractStartDate || null,
        contractRenewalDate: data.contractRenewalDate || null,
        status: data.status || 'ACTIVE',
        createdBy: data.createdBy,
      },
    })

    // TODO: Add audit logging in Phase 2
    // Fire-and-forget audit logging
    try {
      // await this.auditClientOperation('CLIENT_CREATED', client.id, data.createdBy, data)
    } catch (error) {
      console.error('Failed to log audit event:', error)
      // Don't fail the operation
    }

    return client
  }

  /**
   * Update a client
   */
  async updateClient(id: string, data: UpdateClientDto, _adminId: string): Promise<Client> {
    // Validate ID format
    if (!id || id.length < 10) {
      throw new ValidationError('Invalid client ID format')
    }

    // Check if client exists
    const existingClient = await this.db.client.findUnique({
      where: { id },
    })

    if (!existingClient) {
      throw new ClientNotFoundError(id)
    }

    // Validate required fields if provided
    const errors = []
    if (data.companyName !== undefined && !data.companyName) {
      errors.push({ field: 'companyName', message: 'Company name cannot be empty' })
    }
    if (data.contactName !== undefined && !data.contactName) {
      errors.push({ field: 'contactName', message: 'Contact name cannot be empty' })
    }
    if (data.contactEmail !== undefined) {
      if (!data.contactEmail) {
        errors.push({ field: 'contactEmail', message: 'Contact email cannot be empty' })
      } else if (!this.isValidEmail(data.contactEmail)) {
        errors.push({ field: 'contactEmail', message: 'Invalid email format' })
      }
    }
    if (data.serviceTier !== undefined && !data.serviceTier) {
      errors.push({ field: 'serviceTier', message: 'Service tier cannot be empty' })
    }

    if (errors.length > 0) {
      throw new FieldValidationError(errors)
    }

    // Check for duplicate email if email is being changed
    if (data.contactEmail && data.contactEmail !== existingClient.contactEmail) {
      await this.checkDuplicateEmail(data.contactEmail, id)
    }

    // Update client
    const client = await this.db.client.update({
      where: { id },
      data: {
        companyName: data.companyName,
        businessId: data.businessId !== undefined ? data.businessId : undefined,
        sector: data.sector !== undefined ? data.sector : undefined,
        serviceTier: data.serviceTier,
        monthlyRetainer:
          data.monthlyRetainer !== undefined
            ? data.monthlyRetainer
            : undefined,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        contactPhone:
          data.contactPhone !== undefined ? data.contactPhone : undefined,
        contractStartDate:
          data.contractStartDate !== undefined
            ? data.contractStartDate
            : undefined,
        contractRenewalDate:
          data.contractRenewalDate !== undefined
            ? data.contractRenewalDate
            : undefined,
        status: data.status,
      },
    })

    // TODO: Add audit logging in Phase 2
    // Fire-and-forget audit logging
    try {
      // await this.auditClientOperation('CLIENT_UPDATED', client.id, _adminId, data)
    } catch (error) {
      console.error('Failed to log audit event:', error)
      // Don't fail the operation
    }

    return client
  }

  /**
   * Soft delete a client
   */
  async deleteClient(id: string, _adminId: string): Promise<Client> {
    // Validate ID format
    if (!id || id.length < 10) {
      throw new ValidationError('Invalid client ID format')
    }

    // Check if client exists
    const existingClient = await this.db.client.findUnique({
      where: { id },
    })

    if (!existingClient) {
      throw new ClientNotFoundError(id)
    }

    // Soft delete by setting status to INACTIVE
    const client = await this.db.client.update({
      where: { id },
      data: {
        status: 'INACTIVE',
      },
    })

    // TODO: Add audit logging in Phase 2
    // Fire-and-forget audit logging
    try {
      // await this.auditClientOperation('CLIENT_DELETED', client.id, _adminId, { status: 'INACTIVE' })
    } catch (error) {
      console.error('Failed to log audit event:', error)
      // Don't fail the operation
    }

    return client
  }

  /**
   * Private helper: Validate email format
   */
  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  /**
   * Private helper: Check for duplicate email
   */
  private async checkDuplicateEmail(email: string, excludeId?: string): Promise<void> {
    const existingClient = await this.db.client.findFirst({
      where: {
        contactEmail: email,
        status: 'ACTIVE',
        ...(excludeId && { id: { not: excludeId } }),
      },
    })

    if (existingClient) {
      const message = excludeId
        ? `Another client with email ${email} already exists`
        : `A client with email ${email} already exists`
      throw new ValidationError(message)
    }
  }

  /**
   * Private helper: Audit client operations
   * TODO: Implement in Phase 2
   */
  private async auditClientOperation(
    _action: string,
    _clientId: string,
    _adminId: string,
    _changes: Record<string, unknown>
  ): Promise<void> {
    // Placeholder for Phase 2 audit logging
    // await createAuditLog({
    //   adminId: _adminId,
    //   action: _action,
    //   entityType: 'client',
    //   entityId: _clientId,
    //   changes: _changes,
    // })
  }
}

// Singleton instance export following document-parser pattern
export const clientService = new ClientService(prisma)