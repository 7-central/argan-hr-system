// Business services barrel exports
// Following document-parser pattern for clean imports

// Client service exports
export {
  ClientService,
  clientService,
  type GetClientsParams,
  type CreateClientDto,
  type UpdateClientDto,
  type PaginatedResponse,
  type ClientResponse,
} from './client.service'

// Dashboard service exports
export {
  DashboardService,
  dashboardService,
  type DashboardMetrics,
  type ServiceTierBreakdown,
  type RecentClient,
} from './dashboard.service'