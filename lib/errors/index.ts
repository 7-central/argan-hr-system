// Application error exports
// Central export point for all application errors

// Business errors (AppError base class)
export { AppError } from './base';
import { AppError } from './base';

export { ValidationError, FieldValidationError, type FieldError } from './validation';
export { NotFoundError, ClientNotFoundError, AdminNotFoundError } from './not-found';
export {
  AuthenticationError,
  AuthorizationError,
  InvalidCredentialsError,
  SessionExpiredError,
  InsufficientPermissionsError,
} from './authentication';
export { ConflictError, DuplicateResourceError, EmailAlreadyExistsError } from './conflict';

// System/Infrastructure errors (separate from AppError)
export {
  SystemError,
  DatabaseError,
  DatabaseConnectionError,
  ConfigurationError,
  HealthCheckError,
} from './system';

/**
 * Check if an error is an application error (expected, operational error)
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Check if an error is operational (expected) vs programming error
 */
export function isOperationalError(error: unknown): boolean {
  if (isAppError(error)) {
    return error.isOperational;
  }
  return false;
}
