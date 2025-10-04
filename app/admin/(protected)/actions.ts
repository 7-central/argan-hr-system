'use server';

import { withAuth } from '@/lib/server-actions/with-auth';
import { dashboardService } from '@/lib/services/business/dashboard.service';


/**
 * Dashboard Server Actions
 * Actions for dashboard metrics and data
 */

// Get dashboard metrics
export const getDashboardMetrics = withAuth(async (_session) => {
  return await dashboardService.getDashboardMetrics();
});

// Get recent clients
export const getRecentClients = withAuth(async (session, limit?: number) => {
  return await dashboardService.getRecentClients(limit || 5);
});
