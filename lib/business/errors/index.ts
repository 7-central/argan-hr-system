// Business error exports
// Central export point for all business-layer errors

export { BusinessError } from './BusinessError';
import { BusinessError } from './BusinessError';
export { ValidationError, FieldValidationError, type FieldError } from './ValidationError';
export { NotFoundError, ClientNotFoundError, AdminNotFoundError } from './NotFoundError';
export {
  AuthenticationError,
  AuthorizationError,
  InvalidCredentialsError,
  SessionExpiredError,
  InsufficientPermissionsError,
} from './AuthenticationError';
export { ConflictError, DuplicateResourceError, EmailAlreadyExistsError } from './ConflictError';

/**
 * Check if an error is a business error (expected, operational error)
 */
export function isBusinessError(error: unknown): error is BusinessError {
  return error instanceof BusinessError;
}

/**
 * Check if an error is operational (expected) vs programming error
 */
export function isOperationalError(error: unknown): boolean {
  if (isBusinessError(error)) {
    return error.isOperational;
  }
  return false;
}