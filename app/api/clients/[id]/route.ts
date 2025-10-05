// Client-specific API endpoints
// Refactored to use ClientService and middleware

import { withAuth, type AuthenticatedRequest } from '@/lib/middleware/withAuth';
import { withErrorHandling } from '@/lib/middleware/withErrorHandling';
import { withRequestLogging } from '@/lib/middleware/withRequestLogging';
import { clientService } from '@/lib/services/business/client.service';
import { ApiResponseBuilder, getRequestId } from '@/lib/utils/system/response';

/**
 * GET /api/clients/[id] - Get a specific client by ID
 */
async function getClientHandler(
  request: AuthenticatedRequest,
  context: { params: Promise<{ id: string }> }
) {
  const requestId = getRequestId(request);
  const { id: idString } = await context.params;
  const id = parseInt(idString, 10);

  // Use ClientService to get client
  const client = await clientService.getClientById(id);

  return ApiResponseBuilder.success(client, requestId);
}

/**
 * PUT /api/clients/[id] - Update a client
 */
async function updateClientHandler(
  request: AuthenticatedRequest,
  context: { params: Promise<{ id: string }> }
) {
  const requestId = getRequestId(request);
  const { id: idString } = await context.params;
  const id = parseInt(idString, 10);
  const body = await request.json();

  // Use ClientService to update client
  const client = await clientService.updateClient(id, body);

  return ApiResponseBuilder.success(client, requestId);
}

/**
 * DELETE /api/clients/[id] - Soft delete a client
 */
async function deleteClientHandler(
  request: AuthenticatedRequest,
  context: { params: Promise<{ id: string }> }
) {
  const requestId = getRequestId(request);
  const { id: idString } = await context.params;
  const id = parseInt(idString, 10);

  // Use ClientService to soft delete client
  const client = await clientService.deleteClient(id);

  return ApiResponseBuilder.success(client, requestId);
}

// Apply middleware layers: error handling -> logging -> auth
type RouteContext = { params: Promise<{ id: string }> };

export const GET = withErrorHandling<RouteContext>()(
  withRequestLogging<RouteContext>()(withAuth<RouteContext>(getClientHandler))
);
export const PUT = withErrorHandling<RouteContext>()(
  withRequestLogging<RouteContext>()(withAuth<RouteContext>(updateClientHandler))
);
export const DELETE = withErrorHandling<RouteContext>()(
  withRequestLogging<RouteContext>()(withAuth<RouteContext>(deleteClientHandler))
);
