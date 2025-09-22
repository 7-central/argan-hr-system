/**
 * System module exports
 * Infrastructure layer utilities
 */

// Database utilities
export {
  prisma,
  testDatabaseConnection,
  ensureConnection,
  getDatabaseStatus,
  closeDatabaseConnection
} from './database'

// Error types
export {
  SystemError,
  DatabaseError,
  DatabaseConnectionError,
  ConfigurationError,
  HealthCheckError
} from './errors'

// Logger utilities
export {
  logger,
  logDebug,
  logInfo,
  logWarn,
  logError,
  type LogLevel
} from './logger'

// Configuration utilities
export {
  config,
  getConfig,
  isDevelopment,
  isProduction,
  isTest
} from './config'

// Health check utilities
export {
  performHealthCheck,
  getSimpleHealthStatus,
  type HealthStatus,
  type ComponentHealth
} from './health'