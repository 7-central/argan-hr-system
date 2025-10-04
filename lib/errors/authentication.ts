// Authentication and authorization errors

import { AppError } from './base';

/**
 * Error thrown when authentication fails
 */
export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 'AUTHENTICATION_ERROR', 401);
  }
}

/**
 * Error thrown when user is not authorized to perform an action
 */
export class AuthorizationError extends AppError {
  constructor(message = 'You are not authorized to perform this action') {
    super(message, 'AUTHORIZATION_ERROR', 403);
  }
}

/**
 * Error thrown when login credentials are invalid
 */
export class InvalidCredentialsError extends AuthenticationError {
  constructor() {
    super('Invalid email or password');
  }
}

/**
 * Error thrown when session has expired
 */
export class SessionExpiredError extends AuthenticationError {
  constructor() {
    super('Your session has expired. Please log in again.');
  }
}

/**
 * Error thrown when user lacks required role
 */
export class InsufficientPermissionsError extends AuthorizationError {
  constructor(requiredRole: string) {
    super(`This action requires ${requiredRole} role`);
  }
}
