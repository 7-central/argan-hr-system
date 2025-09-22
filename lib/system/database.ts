/**
 * System-level database utilities
 * Infrastructure layer - no business logic
 */

import { PrismaClient } from '@prisma/client'
import { DatabaseConnectionError } from './errors'

// Global variable to store the Prisma client instance
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create a single instance of the Prisma client
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

// Prevent multiple instances in development
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

/**
 * Test database connection with retry logic
 * Used by health endpoints and system checks
 */
export async function testDatabaseConnection(): Promise<{
  connected: boolean
  databaseVersion?: string
  error?: string
}> {
  const maxRetries = 3
  const timeout = 5000 // 5 seconds
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Create a promise that rejects after timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Database connection timeout')), timeout)
      })

      // Race between the query and the timeout
      const result = await Promise.race([
        prisma.$queryRaw<Array<{ version: string }>>`SELECT version() as version`,
        timeoutPromise
      ]) as Array<{ version: string }>

      if (result && result[0]) {
        return {
          connected: true,
          databaseVersion: result[0].version
        }
      }

      return {
        connected: true,
        databaseVersion: 'Unknown'
      }
    } catch (error) {
      lastError = error as Error

      // If not the last attempt, wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
      }
    }
  }

  // All retries failed
  return {
    connected: false,
    error: lastError?.message || 'Database connection failed after multiple attempts'
  }
}

/**
 * Ensure database connection is available
 * Throws DatabaseConnectionError if connection fails
 */
export async function ensureConnection(): Promise<void> {
  const result = await testDatabaseConnection()

  if (!result.connected) {
    throw new DatabaseConnectionError(
      result.error || 'Database connection is not available'
    )
  }
}

/**
 * Get database connection status
 * Returns simple status for monitoring
 */
export async function getDatabaseStatus(): Promise<{
  status: 'healthy' | 'unhealthy'
  message: string
  version?: string
}> {
  try {
    const result = await testDatabaseConnection()

    if (result.connected) {
      return {
        status: 'healthy',
        message: 'Database connection successful',
        version: result.databaseVersion
      }
    }

    return {
      status: 'unhealthy',
      message: result.error || 'Database connection failed'
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Gracefully close database connections
 * Used for application shutdown
 */
export async function closeDatabaseConnection(): Promise<void> {
  await prisma.$disconnect()
}