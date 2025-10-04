/**
 * Business Services Barrel Export
 * Business layer - centralized exports for business logic services
 *
 * Usage:
 * import { clientService, dashboardService, authService } from '@/lib/services/business'
 */

// Authentication service
export { AuthService, authService, type AuthenticatedAdmin } from './auth.service';

// Client management service
export {
  ClientService,
  clientService,
  type GetClientsParams,
  type CreateClientDto,
  type UpdateClientDto,
  type ClientResponse,
  type PaginatedResponse,
} from './client.service';

// Dashboard metrics service
export {
  DashboardService,
  dashboardService,
  type DashboardMetrics,
  type ServiceTierBreakdown,
  type RecentClient,
} from './dashboard.service';
