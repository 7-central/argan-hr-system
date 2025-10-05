/**
 * Business Services Barrel Export
 * Business layer - centralized exports for business logic services
 *
 * Usage:
 * import { clientService, dashboardService, authService, adminService } from '@/lib/services/business'
 */

// Authentication service
export { AuthService, authService, type AuthenticatedAdmin } from './auth.service';

// Admin user management service
export { AdminService, adminService } from './admin.service';

// Client management service
export { ClientService, clientService } from './client.service';

// Dashboard metrics service
export {
  DashboardService,
  dashboardService,
  type DashboardMetrics,
  type ServiceTierBreakdown,
  type RecentClient,
} from './dashboard.service';
