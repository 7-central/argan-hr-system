// Client-specific API endpoints
// Refactored to use ClientService and middleware composition

import { NextResponse } from 'next/server'
import { clientService } from '@/lib/business/services'
import { businessApiStack } from '@/lib/middleware/compositions'
import type { AuthenticatedRequest } from '@/lib/middleware/auth'

/**
 * GET /api/clients/[id] - Get a specific client by ID
 */
async function getClientHandler(
  request: AuthenticatedRequest,
  context: { params: Promise<{ id: string }> }
) {
  // adminSession available but not used in this handler
  const { id } = await context.params

  // Use ClientService to get client
  const client = await clientService.getClientById(id)

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
  context: { params: Promise<{ id: string }> }
) {
  const { adminSession } = request
  const { id } = await context.params
  const body = await request.json()

  // Use ClientService to update client
  const client = await clientService.updateClient(
    id,
    body,
    adminSession.adminId
  )

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
  context: { params: Promise<{ id: string }> }
) {
  const { adminSession } = request
  const { id } = await context.params

  // Use ClientService to soft delete client
  const client = await clientService.deleteClient(
    id,
    adminSession.adminId
  )

  return NextResponse.json({
    success: true,
    data: client,
  })
}

// Apply middleware composition to handlers
export const GET = businessApiStack(getClientHandler)
export const PUT = businessApiStack(updateClientHandler)
export const DELETE = businessApiStack(deleteClientHandler)