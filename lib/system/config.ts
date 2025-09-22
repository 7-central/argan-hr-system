/**
 * System configuration management
 * Validates and provides access to environment configuration
 */

import { ConfigurationError } from './errors'

interface SystemConfig {
  // Database
  databaseUrl: string

  // Application
  nodeEnv: 'development' | 'production' | 'test'
  appUrl: string

  // Security
  adminSessionSecret: string

  // Optional configurations
  port?: number
  logLevel?: 'debug' | 'info' | 'warn' | 'error'
}

class Configuration {
  private config: SystemConfig | null = null

  /**
   * Validate required environment variables
   */
  private validateEnvironment(): SystemConfig {
    const requiredVars = [
      'DATABASE_URL',
      'ADMIN_SESSION_SECRET'
    ]

    // Check for required variables
    const missing = requiredVars.filter(varName => !process.env[varName])
    if (missing.length > 0) {
      throw new ConfigurationError(
        `Missing required environment variables: ${missing.join(', ')}`
      )
    }

    // Validate NODE_ENV
    const nodeEnv = (process.env.NODE_ENV || 'development') as SystemConfig['nodeEnv']
    if (!['development', 'production', 'test'].includes(nodeEnv)) {
      throw new ConfigurationError(
        `Invalid NODE_ENV value: ${nodeEnv}. Must be development, production, or test`
      )
    }

    // Validate ADMIN_SESSION_SECRET length (32-byte hex = 64 characters)
    const sessionSecret = process.env.ADMIN_SESSION_SECRET!
    if (sessionSecret.length !== 64) {
      throw new ConfigurationError(
        'ADMIN_SESSION_SECRET must be a 32-byte hex string (64 characters)'
      )
    }

    return {
      // Required
      databaseUrl: process.env.DATABASE_URL!,
      adminSessionSecret: sessionSecret,

      // Application
      nodeEnv,
      appUrl: process.env.NEXT_PUBLIC_APP_URL ||
        (nodeEnv === 'production'
          ? 'https://argan-hr-system.vercel.app'
          : 'http://localhost:3000'),

      // Optional
      port: process.env.PORT ? parseInt(process.env.PORT, 10) : undefined,
      logLevel: (process.env.LOG_LEVEL as SystemConfig['logLevel']) || 'info'
    }
  }

  /**
   * Get validated configuration (cached)
   */
  getConfig(): SystemConfig {
    if (!this.config) {
      this.config = this.validateEnvironment()
    }
    return this.config
  }

  /**
   * Check if running in development mode
   */
  isDevelopment(): boolean {
    return this.getConfig().nodeEnv === 'development'
  }

  /**
   * Check if running in production mode
   */
  isProduction(): boolean {
    return this.getConfig().nodeEnv === 'production'
  }

  /**
   * Check if running in test mode
   */
  isTest(): boolean {
    return this.getConfig().nodeEnv === 'test'
  }

  /**
   * Get a specific configuration value
   */
  get<K extends keyof SystemConfig>(key: K): SystemConfig[K] {
    return this.getConfig()[key]
  }

  /**
   * Clear cached configuration (useful for testing)
   */
  clearCache(): void {
    this.config = null
  }
}

// Singleton instance
export const config = new Configuration()

// Export convenience functions
export const getConfig = () => config.getConfig()
export const isDevelopment = () => config.isDevelopment()
export const isProduction = () => config.isProduction()
export const isTest = () => config.isTest()