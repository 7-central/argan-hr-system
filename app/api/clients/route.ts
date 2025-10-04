// Client API endpoints
// Refactored to use ClientService and middleware

import { withAuth, type AuthenticatedRequest } from '@/lib/middleware/withAuth';
import { withErrorHandling } from '@/lib/middleware/withErrorHandling';
import { withRequestLogging } from '@/lib/middleware/withRequestLogging';
import { clientService } from '@/lib/services/business/client.service';
import { ApiResponseBuilder, getRequestId } from '@/lib/utils/system/response';

/**
 * GET /api/clients - List clients with search and pagination
 */
async function getClientsHandler(request: AuthenticatedRequest) {
  const requestId = getRequestId(request);

  // Extract query parameters
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 25;
  const search = searchParams.get('search') || undefined;

  // Use ClientService to get clients
  const result = await clientService.getClients({
    page,
    limit,
    search,
  });

  return ApiResponseBuilder.paginated(
    result.clients,
    {
      page: result.pagination.page,
      limit: result.pagination.limit,
      totalCount: result.pagination.totalCount,
      totalPages: result.pagination.totalPages,
    },
    requestId
  );
}

/**
 * POST /api/clients - Create a new client
 */
async function createClientHandler(request: AuthenticatedRequest) {
  const requestId = getRequestId(request);
  const body = await request.json();

  // Use ClientService to create client
  const client = await clientService.createClient(body);

  return ApiResponseBuilder.success(client, requestId, 201);
}

// Apply middleware layers: error handling -> logging -> auth
export const GET = withErrorHandling()(withRequestLogging()(withAuth(getClientsHandler)));
export const POST = withErrorHandling()(withRequestLogging()(withAuth(createClientHandler)));
