// Not found errors for missing resources

import { AppError } from './base';

/**
 * Error thrown when a requested resource cannot be found
 */
export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string | number) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;

    super(message, 'NOT_FOUND', 404, { resource, identifier });
  }
}

/**
 * Specific error for client not found
 */
export class ClientNotFoundError extends NotFoundError {
  constructor(clientId: string) {
    super('Client', clientId);
  }
}

/**
 * Specific error for admin user not found
 */
export class AdminNotFoundError extends NotFoundError {
  constructor(adminId: string) {
    super('Admin user', adminId);
  }
}
