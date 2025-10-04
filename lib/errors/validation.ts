// Validation errors for business rule violations

import { AppError } from './base';

/**
 * Error thrown when input validation fails
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

/**
 * Details for field validation errors
 */
export interface FieldError {
  field: string;
  message: string;
  code?: string;
}

/**
 * Error thrown when multiple field validations fail
 */
export class FieldValidationError extends ValidationError {
  public readonly fields: FieldError[];

  constructor(fields: FieldError[], message = 'Validation failed') {
    super(message, { fields });
    this.fields = fields;
  }
}
