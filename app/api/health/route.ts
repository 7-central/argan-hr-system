/**
 * Health check endpoint
 * Infrastructure endpoint - no business logic or middleware
 * Used for monitoring system health in production
 */

import { performHealthCheck } from '@/lib/system/health'
import { logger } from '@/lib/system/logger'

/**
 * GET /api/health
 * Returns system health status
 */
export async function GET(): Promise<Response> {
  try {
    const health = await performHealthCheck()

    // Determine HTTP status code based on health
    const statusCode =
      health.status === 'healthy' ? 200 :
      health.status === 'degraded' ? 200 :  // Still return 200 for degraded
      503  // Service unavailable for unhealthy

    // Log unhealthy status
    if (health.status === 'unhealthy') {
      logger.warn('Health check returned unhealthy status', health)
    }

    return Response.json(health, {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    // Log the error
    logger.error('Health check endpoint failed', error)

    // Return unhealthy status
    return Response.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '2.0.0',
        error: error instanceof Error ? error.message : 'Unknown error',
        checks: {
          database: {
            status: 'unhealthy',
            message: 'Health check failed'
          },
          configuration: {
            status: 'unhealthy',
            message: 'Health check failed'
          }
        }
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Content-Type': 'application/json'
        }
      }
    )
  }
}