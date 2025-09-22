// Client API endpoints
// Refactored to use middleware composition and proper error handling

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/system/database'
import { businessApiStack } from '@/lib/middleware/compositions'
import type { AuthenticatedRequest } from '@/lib/middleware/auth'
import { ValidationError, FieldValidationError } from '@/lib/business/errors'

/**
 * GET /api/clients - List clients with search and pagination
 */
async function getClientsHandler(request: AuthenticatedRequest) {
  // adminSession available but not used in this handler

  // Extract query parameters
  const { searchParams } = new URL(request.url)
  const page = Number(searchParams.get('page')) || 1
  const limit = Number(searchParams.get('limit')) || 25
  const search = searchParams.get('search') || ''

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

  // Fetch clients with pagination
  const [clients, totalCount] = await Promise.all([
    prisma.client.findMany({
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
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.client.count({ where }),
  ])

  const totalPages = Math.ceil(totalCount / limit)

  return NextResponse.json({
    success: true,
    data: {
      clients,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    },
  })
}

/**
 * POST /api/clients - Create a new client
 */
async function createClientHandler(request: AuthenticatedRequest) {
  const { adminSession } = request
  const body = await request.json()

  // Validate required fields
  const errors = []
  if (!body.companyName) {
    errors.push({ field: 'companyName', message: 'Company name is required' })
  }
  if (!body.contactName) {
    errors.push({ field: 'contactName', message: 'Contact name is required' })
  }
  if (!body.contactEmail) {
    errors.push({ field: 'contactEmail', message: 'Contact email is required' })
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.contactEmail)) {
    errors.push({ field: 'contactEmail', message: 'Invalid email format' })
  }
  if (!body.serviceTier) {
    errors.push({ field: 'serviceTier', message: 'Service tier is required' })
  }

  if (errors.length > 0) {
    throw new FieldValidationError(errors)
  }

  // Check for duplicate email
  const existingClient = await prisma.client.findFirst({
    where: {
      contactEmail: body.contactEmail,
      status: 'ACTIVE',
    },
  })

  if (existingClient) {
    throw new ValidationError(
      `A client with email ${body.contactEmail} already exists`
    )
  }

  // Create client
  const client = await prisma.client.create({
    data: {
      companyName: body.companyName,
      businessId: body.businessId || null,
      sector: body.sector || null,
      serviceTier: body.serviceTier,
      monthlyRetainer: body.monthlyRetainer ? Number(body.monthlyRetainer) : null,
      contactName: body.contactName,
      contactEmail: body.contactEmail,
      contactPhone: body.contactPhone || null,
      contractStartDate: body.contractStartDate
        ? new Date(body.contractStartDate)
        : null,
      contractRenewalDate: body.contractRenewalDate
        ? new Date(body.contractRenewalDate)
        : null,
      status: body.status || 'ACTIVE',
      createdBy: adminSession.adminId,
    },
  })

  // TODO: Add audit logging in Phase 2
  // await createAuditLog({
  //   adminId: adminSession.adminId,
  //   action: 'CLIENT_CREATED',
  //   entityType: 'client',
  //   entityId: client.id,
  //   changes: body,
  // })

  return NextResponse.json({
    success: true,
    data: client,
  }, { status: 201 })
}

// Apply middleware composition to handlers
export const GET = businessApiStack(getClientsHandler)
export const POST = businessApiStack(createClientHandler)