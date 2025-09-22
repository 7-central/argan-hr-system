// Business layer error base class
// Represents errors in application business logic

/**
 * Base class for all business-layer errors
 * These are expected application errors (validation, auth, not found, etc.)
 */
export class BusinessError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;
  public readonly isOperational = true; // Always true for business errors

  constructor(
    message: string,
    code: string,
    statusCode: number = 400,
    details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert to JSON for API responses
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}