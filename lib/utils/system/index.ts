/**
 * System Utilities Barrel Export
 * Infrastructure layer - centralized exports for system utilities
 *
 * Usage:
 * import { config, logger, performHealthCheck, createApiResponse } from '@/lib/utils/system'
 */

// Configuration management
export { config } from './config';

// Health check utilities
export {
  performHealthCheck,
  isSystemHealthy,
  isSystemReady,
  isSystemAlive,
  type SystemHealth,
  type ComponentCheck,
  type HealthStatus,
} from './health';

// Logging utilities
export { logger, logDebug, logInfo, logWarn, logError, type LogLevel } from './logger';

// Password utilities
export { hashPassword, verifyPassword } from './password';

// Rate limiting
export { checkLoginRateLimit, recordFailedLogin, resetLoginAttempts } from './rate-limit';

// HTTP response utilities
export {
  ApiResponseBuilder,
  getRequestId,
  isApiResponse,
  type ApiResponse,
  type PaginatedApiResponse,
} from './response';

// Session management
export { createAdminSession, validateSession, clearAdminSession } from './session';
