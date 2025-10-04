// Conflict errors for resource conflicts

import { AppError } from './base';

/**
 * Error thrown when there's a conflict with existing data
 */
export class ConflictError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'CONFLICT', 409, details);
  }
}

/**
 * Error thrown when trying to create a duplicate resource
 */
export class DuplicateResourceError extends ConflictError {
  constructor(resource: string, field: string, value: string) {
    super(`${resource} with ${field} '${value}' already exists`, { resource, field, value });
  }
}

/**
 * Error thrown when email already exists
 */
export class EmailAlreadyExistsError extends DuplicateResourceError {
  constructor(email: string) {
    super('User', 'email', email);
  }
}
