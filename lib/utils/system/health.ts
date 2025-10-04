/**
 * System Health Check Utilities
 * Infrastructure layer - health monitoring and status checks
 *
 * Purpose:
 * - Provide health check endpoints for load balancers
 * - Monitor system resources (memory, database)
 * - Enable uptime monitoring and observability
 * - Support Kubernetes/Docker readiness/liveness probes
 */

import { getDatabaseStatus } from '@/lib/database';

import { config } from './config';

/**
 * Health check status
 */
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

/**
 * Individual component check result
 */
export interface ComponentCheck {
  status: 'healthy' | 'unhealthy';
  message: string;
  responseTime?: number;
  details?: Record<string, unknown>;
}

/**
 * Overall system health result
 */
export interface SystemHealth {
  status: HealthStatus;
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
  checks: {
    database: ComponentCheck;
    memory: ComponentCheck;
    configuration: ComponentCheck;
  };
}

/**
 * Memory status thresholds (in MB)
 */
const MEMORY_WARNING_THRESHOLD = 400; // Warn if using > 400MB
const MEMORY_CRITICAL_THRESHOLD = 800; // Critical if using > 800MB

/**
 * Get memory usage status
 */
function getMemoryStatus(): ComponentCheck {
  const usage = process.memoryUsage();
  const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);

  let status: 'healthy' | 'unhealthy' = 'healthy';
  let message = `Memory usage: ${heapUsedMB}MB / ${heapTotalMB}MB`;

  if (heapUsedMB > MEMORY_CRITICAL_THRESHOLD) {
    status = 'unhealthy';
    message = `Critical memory usage: ${heapUsedMB}MB (threshold: ${MEMORY_CRITICAL_THRESHOLD}MB)`;
  } else if (heapUsedMB > MEMORY_WARNING_THRESHOLD) {
    message = `High memory usage: ${heapUsedMB}MB (warning threshold: ${MEMORY_WARNING_THRESHOLD}MB)`;
  }

  return {
    status,
    message,
    details: {
      heapUsed: heapUsedMB,
      heapTotal: heapTotalMB,
      rss: Math.round(usage.rss / 1024 / 1024),
      external: Math.round(usage.external / 1024 / 1024),
    },
  };
}

/**
 * Get configuration status
 * Checks if critical configuration values are present
 */
function getConfigStatus(): ComponentCheck {
  try {
    // Verify critical config exists
    const hasDatabase = !!config.database.url;
    const hasSessionSecret = !!config.auth.sessionSecret;

    if (hasDatabase && hasSessionSecret) {
      return {
        status: 'healthy',
        message: 'Configuration valid',
        details: {
          environment: config.app.environment,
          apiVersion: config.api.version,
        },
      };
    }

    return {
      status: 'unhealthy',
      message: 'Missing critical configuration',
      details: {
        hasDatabase,
        hasSessionSecret,
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Configuration error',
    };
  }
}

/**
 * Get database status check
 */
async function getDatabaseCheck(): Promise<ComponentCheck> {
  const startTime = Date.now();

  try {
    const dbStatus = await getDatabaseStatus();
    const responseTime = Date.now() - startTime;

    return {
      status: dbStatus.status === 'healthy' ? 'healthy' : 'unhealthy',
      message: dbStatus.message,
      responseTime,
      details: {
        version: dbStatus.version,
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Database check failed',
      responseTime: Date.now() - startTime,
    };
  }
}

/**
 * Perform comprehensive health check
 * Returns overall system health status
 */
export async function performHealthCheck(): Promise<SystemHealth> {
  const [databaseCheck, memoryCheck, configCheck] = await Promise.all([
    getDatabaseCheck(),
    Promise.resolve(getMemoryStatus()),
    Promise.resolve(getConfigStatus()),
  ]);

  // Determine overall status
  let overallStatus: HealthStatus = 'healthy';

  const checks = {
    database: databaseCheck,
    memory: memoryCheck,
    configuration: configCheck,
  };

  // If any check is unhealthy, system is degraded or unhealthy
  const unhealthyCount = Object.values(checks).filter(
    (check) => check.status === 'unhealthy'
  ).length;

  if (unhealthyCount >= 2) {
    overallStatus = 'unhealthy';
  } else if (unhealthyCount === 1) {
    overallStatus = 'degraded';
  }

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.app.environment,
    version: config.api.version,
    checks,
  };
}

/**
 * Simple health check for basic monitoring
 * Returns 200 OK if system is healthy or degraded
 */
export async function isSystemHealthy(): Promise<boolean> {
  const health = await performHealthCheck();
  return health.status === 'healthy' || health.status === 'degraded';
}

/**
 * Quick readiness check for Kubernetes/Docker
 * Only checks database connectivity
 */
export async function isSystemReady(): Promise<boolean> {
  try {
    const dbStatus = await getDatabaseStatus();
    return dbStatus.status === 'healthy';
  } catch {
    return false;
  }
}

/**
 * Liveness check for Kubernetes/Docker
 * Checks if the process is running
 */
export function isSystemAlive(): boolean {
  return true; // If this code runs, process is alive
}
