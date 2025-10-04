/**
 * System Configuration
 * Infrastructure layer - centralized configuration management
 *
 * Purpose:
 * - Validate required environment variables on startup
 * - Provide type-safe access to configuration
 * - Convert string env vars to appropriate types
 * - Fail-fast if critical config is missing
 */

/**
 * Require an environment variable to exist
 * Throws error if missing - causes app to fail on startup
 */
function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}\n` +
        `Please add ${key} to your .env file or environment configuration.`
    );
  }
  return value;
}

/**
 * Get optional environment variable with default
 */
function getEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

/**
 * Get optional number environment variable with default
 */
function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a valid number, got: ${value}`);
  }
  return parsed;
}

/**
 * Get environment type
 */
function getEnvironment(): 'development' | 'production' | 'test' {
  const env = process.env.NODE_ENV;
  if (env === 'production') return 'production';
  if (env === 'test') return 'test';
  return 'development';
}

/**
 * Centralized application configuration
 * All configuration values are validated on initialization
 */
export const config = {
  /**
   * Application environment settings
   */
  app: {
    environment: getEnvironment(),
    isDevelopment: getEnvironment() === 'development',
    isProduction: getEnvironment() === 'production',
    isTest: getEnvironment() === 'test',
    port: getEnvNumber('PORT', 3000),
  },

  /**
   * Database configuration
   */
  database: {
    url: requireEnv('DATABASE_URL'),
    maxConnections: getEnvNumber('DB_MAX_CONNECTIONS', 10),
    connectionTimeout: getEnvNumber('DB_CONNECTION_TIMEOUT', 15),
  },

  /**
   * Authentication & session configuration
   */
  auth: {
    sessionSecret: requireEnv('ADMIN_SESSION_SECRET'),
    sessionDuration: getEnvNumber('SESSION_DURATION', 86400), // 24 hours default
    jwtSecret: getEnv('JWT_SECRET', ''), // Optional - only if using JWT
  },

  /**
   * API configuration
   */
  api: {
    version: getEnv('API_VERSION', 'v2.0'),
    rateLimitWindow: getEnvNumber('RATE_LIMIT_WINDOW', 60), // 60 seconds
    rateLimitMax: getEnvNumber('RATE_LIMIT_MAX', 100), // 100 requests per window
  },

  /**
   * Third-party services (optional)
   */
  services: {
    blobToken: getEnv('BLOB_READ_WRITE_TOKEN', ''),
    stackProjectId: getEnv('NEXT_PUBLIC_STACK_PROJECT_ID', ''),
    stackPublishableKey: getEnv('NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY', ''),
    stackSecretKey: getEnv('STACK_SECRET_SERVER_KEY', ''),
  },
} as const;

/**
 * Validate configuration on module load
 * This ensures the app fails fast if critical config is missing
 */
function validateConfig(): void {
  try {
    // Test that all required fields can be accessed
    // This will throw if any required env vars are missing
    void config.database.url;
    void config.auth.sessionSecret;

    // If we get here, all required config is present
    if (config.app.isDevelopment) {
      console.log('✓ Configuration validated successfully');
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ Configuration validation failed:', error.message);
      throw error;
    }
  }
}

// Validate config when module is imported
validateConfig();
