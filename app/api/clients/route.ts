// Client API endpoints
// Refactored to use ClientService and middleware composition

import { NextResponse } from 'next/server'
import { clientService } from '@/lib/business/services'
import { businessApiStack } from '@/lib/middleware/compositions'
import type { AuthenticatedRequest } from '@/lib/middleware/auth'

/**
 * GET /api/clients - List clients with search and pagination
 */
async function getClientsHandler(request: AuthenticatedRequest) {
  // adminSession available but not used in this handler

  // Extract query parameters
  const { searchParams } = new URL(request.url)
  const page = Number(searchParams.get('page')) || 1
  const limit = Number(searchParams.get('limit')) || 25
  const search = searchParams.get('search') || undefined

  // Use ClientService to get clients
  const result = await clientService.getClients({
    page,
    limit,
    search
  })

  return NextResponse.json({
    success: true,
    data: result,
  })
}

/**
 * POST /api/clients - Create a new client
 */
async function createClientHandler(request: AuthenticatedRequest) {
  const { adminSession } = request
  const body = await request.json()

  // Use ClientService to create client
  const client = await clientService.createClient({
    ...body,
    createdBy: adminSession.adminId,
  })

  return NextResponse.json({
    success: true,
    data: client,
  }, { status: 201 })
}

// Apply middleware composition to handlers
export const GET = businessApiStack(getClientsHandler)
export const POST = businessApiStack(createClientHandler)