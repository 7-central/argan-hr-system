/**
 * System health check utilities
 * Used by health endpoints for monitoring
 */

import { testDatabaseConnection } from './database'
import { config } from './config'
import { logger } from './logger'

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  checks: {
    database: ComponentHealth
    configuration: ComponentHealth
    memory?: ComponentHealth
  }
}

export interface ComponentHealth {
  status: 'healthy' | 'unhealthy'
  message: string
  details?: Record<string, unknown>
}

/**
 * Check database health
 */
async function checkDatabase(): Promise<ComponentHealth> {
  try {
    const result = await testDatabaseConnection()

    if (result.connected) {
      return {
        status: 'healthy',
        message: 'Database connection successful',
        details: {
          version: result.databaseVersion
        }
      }
    }

    return {
      status: 'unhealthy',
      message: result.error || 'Database connection failed'
    }
  } catch (error) {
    logger.error('Database health check failed', error)
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Check configuration health
 */
function checkConfiguration(): ComponentHealth {
  try {
    const systemConfig = config.getConfig()

    // Check critical configuration values
    if (!systemConfig.databaseUrl || !systemConfig.adminSessionSecret) {
      return {
        status: 'unhealthy',
        message: 'Critical configuration missing'
      }
    }

    return {
      status: 'healthy',
      message: 'Configuration validated',
      details: {
        environment: systemConfig.nodeEnv,
        appUrl: systemConfig.appUrl
      }
    }
  } catch (error) {
    logger.error('Configuration health check failed', error)
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Configuration validation failed'
    }
  }
}

/**
 * Check memory usage (optional)
 */
function checkMemory(): ComponentHealth {
  try {
    const memUsage = process.memoryUsage()
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024)
    const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024)
    const heapPercentage = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)

    // Consider unhealthy if heap usage is over 90%
    if (heapPercentage > 90) {
      return {
        status: 'unhealthy',
        message: `High memory usage: ${heapPercentage}%`,
        details: {
          heapUsedMB,
          heapTotalMB,
          heapPercentage
        }
      }
    }

    return {
      status: 'healthy',
      message: 'Memory usage normal',
      details: {
        heapUsedMB,
        heapTotalMB,
        heapPercentage
      }
    }
  } catch {
    return {
      status: 'unhealthy',
      message: 'Failed to check memory usage'
    }
  }
}

/**
 * Perform comprehensive health check
 */
export async function performHealthCheck(): Promise<HealthStatus> {
  const [databaseHealth, configHealth] = await Promise.all([
    checkDatabase(),
    Promise.resolve(checkConfiguration())
  ])

  const memoryHealth = checkMemory()

  // Determine overall status
  let overallStatus: HealthStatus['status'] = 'healthy'

  // If any critical component is unhealthy, overall is unhealthy
  if (databaseHealth.status === 'unhealthy' || configHealth.status === 'unhealthy') {
    overallStatus = 'unhealthy'
  }
  // If memory is unhealthy, system is degraded but still operational
  else if (memoryHealth.status === 'unhealthy') {
    overallStatus = 'degraded'
  }

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '2.0.0',
    checks: {
      database: databaseHealth,
      configuration: configHealth,
      memory: memoryHealth
    }
  }
}

/**
 * Get simple health status for quick checks
 */
export async function getSimpleHealthStatus(): Promise<{
  healthy: boolean
  message: string
}> {
  try {
    const health = await performHealthCheck()
    return {
      healthy: health.status !== 'unhealthy',
      message: health.status === 'healthy'
        ? 'All systems operational'
        : health.status === 'degraded'
        ? 'System degraded but operational'
        : 'System unhealthy'
    }
  } catch (error) {
    logger.error('Health check failed', error)
    return {
      healthy: false,
      message: 'Health check failed'
    }
  }
}