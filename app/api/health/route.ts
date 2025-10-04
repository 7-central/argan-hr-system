/**
 * Health Check Endpoint
 * Public API endpoint for monitoring system health
 *
 * Usage:
 * - Load balancers: Check if service is available
 * - Monitoring tools: Uptime monitoring (Pingdom, UptimeRobot, etc.)
 * - Kubernetes: Readiness and liveness probes
 * - Debugging: Quick system status overview
 *
 * Returns:
 * - 200: System is healthy or degraded (still operational)
 * - 503: System is unhealthy (service unavailable)
 */

import { NextResponse } from 'next/server';

import { performHealthCheck } from '@/lib/utils/system';

/**
 * GET /api/health
 * Comprehensive health check with all system components
 */
export async function GET() {
  try {
    const health = await performHealthCheck();

    // Determine HTTP status code based on health status
    // - healthy: 200 OK
    // - degraded: 200 OK (still operational, but with issues)
    // - unhealthy: 503 Service Unavailable
    const statusCode = health.status === 'unhealthy' ? 503 : 200;

    return NextResponse.json(health, { status: statusCode });
  } catch (error) {
    // If health check itself fails, return 503
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Health check failed',
      },
      { status: 503 }
    );
  }
}
