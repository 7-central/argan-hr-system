// Client-specific API endpoints
// Refactored to use middleware composition and proper error handling

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/system/database'
import { businessApiStack } from '@/lib/middleware/compositions'
import type { AuthenticatedRequest } from '@/lib/middleware/auth'
import {
  ClientNotFoundError,
  ValidationError,
  FieldValidationError,
} from '@/lib/business/errors'

/**
 * GET /api/clients/[id] - Get a specific client by ID
 */
async function getClientHandler(
  request: AuthenticatedRequest,
  context?: { params: Promise<{ id: string }> }
) {
  if (!context) {
    throw new ValidationError('Missing route context')
  }
  // adminSession available but not used in this handler
  const { id } = await context.params

  // Validate ID format
  if (!id || id.length < 10) {
    throw new ValidationError('Invalid client ID format')
  }

  const client = await prisma.client.findUnique({
    where: { id },
  })

  if (!client) {
    throw new ClientNotFoundError(id)
  }

  return NextResponse.json({
    success: true,
    data: client,
  })
}

/**
 * PUT /api/clients/[id] - Update a client
 */
async function updateClientHandler(
  request: AuthenticatedRequest,
  context?: { params: Promise<{ id: string }> }
) {
  if (!context) {
    throw new ValidationError('Missing route context')
  }
  // adminSession available but not used in this handler
  const { id } = await context.params
  const body = await request.json()

  // Validate ID format
  if (!id || id.length < 10) {
    throw new ValidationError('Invalid client ID format')
  }

  // Check if client exists
  const existingClient = await prisma.client.findUnique({
    where: { id },
  })

  if (!existingClient) {
    throw new ClientNotFoundError(id)
  }

  // Validate required fields if provided
  const errors = []
  if (body.companyName !== undefined && !body.companyName) {
    errors.push({ field: 'companyName', message: 'Company name cannot be empty' })
  }
  if (body.contactName !== undefined && !body.contactName) {
    errors.push({ field: 'contactName', message: 'Contact name cannot be empty' })
  }
  if (body.contactEmail !== undefined) {
    if (!body.contactEmail) {
      errors.push({ field: 'contactEmail', message: 'Contact email cannot be empty' })
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.contactEmail)) {
      errors.push({ field: 'contactEmail', message: 'Invalid email format' })
    }
  }
  if (body.serviceTier !== undefined && !body.serviceTier) {
    errors.push({ field: 'serviceTier', message: 'Service tier cannot be empty' })
  }

  if (errors.length > 0) {
    throw new FieldValidationError(errors)
  }

  // Check for duplicate email if email is being changed
  if (body.contactEmail && body.contactEmail !== existingClient.contactEmail) {
    const duplicateClient = await prisma.client.findFirst({
      where: {
        contactEmail: body.contactEmail,
        status: 'ACTIVE',
        id: { not: id },
      },
    })

    if (duplicateClient) {
      throw new ValidationError(
        `Another client with email ${body.contactEmail} already exists`
      )
    }
  }

  // Update client
  const client = await prisma.client.update({
    where: { id },
    data: {
      companyName: body.companyName,
      businessId: body.businessId !== undefined ? body.businessId : undefined,
      sector: body.sector !== undefined ? body.sector : undefined,
      serviceTier: body.serviceTier,
      monthlyRetainer:
        body.monthlyRetainer !== undefined
          ? body.monthlyRetainer
            ? Number(body.monthlyRetainer)
            : null
          : undefined,
      contactName: body.contactName,
      contactEmail: body.contactEmail,
      contactPhone:
        body.contactPhone !== undefined ? body.contactPhone : undefined,
      contractStartDate:
        body.contractStartDate !== undefined
          ? body.contractStartDate
            ? new Date(body.contractStartDate)
            : null
          : undefined,
      contractRenewalDate:
        body.contractRenewalDate !== undefined
          ? body.contractRenewalDate
            ? new Date(body.contractRenewalDate)
            : null
          : undefined,
      status: body.status,
    },
  })

  // TODO: Add audit logging in Phase 2
  // await createAuditLog({
  //   adminId: adminSession.adminId,
  //   action: 'CLIENT_UPDATED',
  //   entityType: 'client',
  //   entityId: client.id,
  //   changes: body,
  // })

  return NextResponse.json({
    success: true,
    data: client,
  })
}

/**
 * DELETE /api/clients/[id] - Soft delete a client
 */
async function deleteClientHandler(
  request: AuthenticatedRequest,
  context?: { params: Promise<{ id: string }> }
) {
  if (!context) {
    throw new ValidationError('Missing route context')
  }
  // adminSession available but not used in this handler
  const { id } = await context.params

  // Validate ID format
  if (!id || id.length < 10) {
    throw new ValidationError('Invalid client ID format')
  }

  // Check if client exists
  const existingClient = await prisma.client.findUnique({
    where: { id },
  })

  if (!existingClient) {
    throw new ClientNotFoundError(id)
  }

  // Soft delete by setting status to INACTIVE
  const client = await prisma.client.update({
    where: { id },
    data: {
      status: 'INACTIVE',
    },
  })

  // TODO: Add audit logging in Phase 2
  // await createAuditLog({
  //   adminId: adminSession.adminId,
  //   action: 'CLIENT_DELETED',
  //   entityType: 'client',
  //   entityId: client.id,
  //   changes: { status: 'INACTIVE' },
  // })

  return NextResponse.json({
    success: true,
    data: client,
  })
}

// Apply middleware composition to handlers
export const GET = businessApiStack(getClientHandler)
export const PUT = businessApiStack(updateClientHandler)
export const DELETE = businessApiStack(deleteClientHandler)