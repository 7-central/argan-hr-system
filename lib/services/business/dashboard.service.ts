import { PrismaClient } from '@prisma/client';

import { getDatabaseInstance } from '@/lib/database';

// Dashboard response types
export interface DashboardMetrics {
  totalActiveClients: number;
  serviceTierBreakdown: ServiceTierBreakdown;
  totalMonthlyRevenue: number;
  upcomingRenewals: number;
}

export interface ServiceTierBreakdown {
  TIER_1: number;
  DOC_ONLY: number;
  AD_HOC: number;
}

export interface RecentClient {
  companyName: string;
  serviceTier: 'TIER_1' | 'DOC_ONLY' | 'AD_HOC';
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
}

/**
 * DashboardService - Business logic for dashboard metrics
 *
 * Key patterns:
 * - Constructor dependency injection for database access
 * - Parallel database queries for performance
 * - Proper error handling
 * - Data transformation for frontend consumption
 */
export class DashboardService {
  constructor(private readonly db: PrismaClient) {}

  /**
   * Get all dashboard metrics in parallel for performance
   */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // Parallel database queries for better performance
    const [
      totalActiveClients,
      tier1Count,
      docOnlyCount,
      adHocCount,
      monthlyRevenueData,
      upcomingRenewals,
    ] = await this.db.$transaction([
      // Total active clients
      this.db.client.count({
        where: { status: 'ACTIVE' },
      }),

      // Service tier counts - individual queries for type safety
      this.db.client.count({
        where: { status: 'ACTIVE', serviceTier: 'TIER_1' },
      }),
      this.db.client.count({
        where: { status: 'ACTIVE', serviceTier: 'DOC_ONLY' },
      }),
      this.db.client.count({
        where: { status: 'ACTIVE', serviceTier: 'AD_HOC' },
      }),

      // Monthly revenue (sum of all active client retainers)
      this.db.client.aggregate({
        where: { status: 'ACTIVE' },
        _sum: { monthlyRetainer: true },
      }),

      // Upcoming renewals (within 30 days)
      this.db.client.count({
        where: {
          status: 'ACTIVE',
          contractRenewalDate: {
            gte: new Date(),
            lte: thirtyDaysFromNow,
          },
        },
      }),
    ]);

    // Build service tier breakdown object directly
    const serviceTierBreakdown: ServiceTierBreakdown = {
      TIER_1: tier1Count,
      DOC_ONLY: docOnlyCount,
      AD_HOC: adHocCount,
    };

    // Calculate total monthly revenue
    const totalMonthlyRevenue = monthlyRevenueData._sum.monthlyRetainer || 0;

    return {
      totalActiveClients,
      serviceTierBreakdown,
      totalMonthlyRevenue: Number(totalMonthlyRevenue), // Convert Decimal to number
      upcomingRenewals,
    };
  }

  /**
   * Get recent clients (last N)
   */
  async getRecentClients(limit: number = 3): Promise<RecentClient[]> {
    const recentClients = await this.db.client.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        companyName: true,
        serviceTier: true,
        status: true,
      },
    });

    return recentClients;
  }

  /**
   * Get service tier breakdown
   */
  async getServiceTierBreakdown(): Promise<ServiceTierBreakdown> {
    // Get individual counts for type safety
    const [tier1Count, docOnlyCount, adHocCount] = await this.db.$transaction([
      this.db.client.count({
        where: { status: 'ACTIVE', serviceTier: 'TIER_1' },
      }),
      this.db.client.count({
        where: { status: 'ACTIVE', serviceTier: 'DOC_ONLY' },
      }),
      this.db.client.count({
        where: { status: 'ACTIVE', serviceTier: 'AD_HOC' },
      }),
    ]);

    return {
      TIER_1: tier1Count,
      DOC_ONLY: docOnlyCount,
      AD_HOC: adHocCount,
    };
  }

  /**
   * Get upcoming renewals count
   */
  async getUpcomingRenewals(daysAhead: number = 30): Promise<number> {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysAhead);

    const count = await this.db.client.count({
      where: {
        status: 'ACTIVE',
        contractRenewalDate: {
          gte: new Date(),
          lte: targetDate,
        },
      },
    });

    return count;
  }

  /**
   * Get total monthly revenue
   */
  async getTotalMonthlyRevenue(): Promise<number> {
    const result = await this.db.client.aggregate({
      where: { status: 'ACTIVE' },
      _sum: { monthlyRetainer: true },
    });

    return Number(result._sum.monthlyRetainer || 0);
  }

  /**
   * Get active clients count
   */
  async getActiveClientsCount(): Promise<number> {
    return await this.db.client.count({
      where: { status: 'ACTIVE' },
    });
  }
}

// Singleton instance export with environment-specific database
export const dashboardService = new DashboardService(getDatabaseInstance());
