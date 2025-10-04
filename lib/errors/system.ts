/**
 * System-level error classes for infrastructure layer
 * These errors are separate from business errors and should only be used
 * for system/infrastructure concerns like database connectivity, configuration, etc.
 */

/**
 * Base class for all system-level errors
 */
export class SystemError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'SystemError';
    // Capture stack trace for debugging
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Database-related system errors
 */
export class DatabaseError extends SystemError {
  constructor(message: string) {
    super(message, 'DATABASE_ERROR');
    this.name = 'DatabaseError';
  }
}

/**
 * Database connection specific errors
 */
export class DatabaseConnectionError extends DatabaseError {
  constructor(message: string = 'Failed to connect to database') {
    super(message);
    this.name = 'DatabaseConnectionError';
  }
}

/**
 * Configuration-related system errors
 */
export class ConfigurationError extends SystemError {
  constructor(message: string) {
    super(message, 'CONFIGURATION_ERROR');
    this.name = 'ConfigurationError';
  }
}

/**
 * System health check errors
 */
export class HealthCheckError extends SystemError {
  constructor(
    message: string,
    public readonly component: string
  ) {
    super(message, 'HEALTH_CHECK_ERROR');
    this.name = 'HealthCheckError';
  }
}
