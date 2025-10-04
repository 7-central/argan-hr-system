// Error handling middleware
// Catches and formats both System and Business errors appropriately

import { NextRequest, NextResponse } from 'next/server';

import { AppError, isAppError } from '@/lib/errors';
import { SystemError } from '@/lib/errors/system';
import { logError } from '@/lib/utils/system/logger';

/**
 * Middleware handler types
 */
type Handler<T = unknown> = (
  request: NextRequest,
  context: T
) => Promise<NextResponse> | NextResponse;
type Middleware<T = unknown> = (handler: Handler<T>) => Handler<T>;

/**
 * Error response structure
 */
interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    details?: unknown;
  };
  requestId?: string;
  timestamp: string;
}

/**
 * Generate a unique request ID for tracking
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Format error for API response
 */
function formatErrorResponse(error: Error, requestId: string): ErrorResponse {
  const timestamp = new Date().toISOString();

  // Handle Business errors (expected, operational)
  if (isAppError(error)) {
    const appError = error as AppError;
    return {
      success: false,
      error: {
        message: appError.message,
        code: appError.code,
        details: appError.details,
      },
      requestId,
      timestamp,
    };
  }

  // Handle System errors (infrastructure issues)
  if (error instanceof SystemError) {
    // Log system errors as they indicate infrastructure problems
    logError('System error occurred', error);

    // Return generic message to client for security
    return {
      success: false,
      error: {
        message: 'A system error occurred. Please try again later.',
        code: 'SYSTEM_ERROR',
      },
      requestId,
      timestamp,
    };
  }

  // Handle unexpected errors (programming errors, unhandled cases)
  logError('Unexpected error occurred', error);

  // Never expose internal error details to client
  return {
    success: false,
    error: {
      message: 'An unexpected error occurred. Please try again later.',
      code: 'INTERNAL_ERROR',
    },
    requestId,
    timestamp,
  };
}

/**
 * Error handling middleware
 * Catches all errors and returns appropriate formatted responses
 */
export function withErrorHandling<T = unknown>(): Middleware<T> {
  return (handler: Handler<T>) => {
    return async (request: NextRequest, context: T): Promise<NextResponse> => {
      const requestId = generateRequestId();

      try {
        // Add request ID to headers for tracking
        const response = await handler(request, context);

        // Add request ID to response headers
        const headers = new Headers(response.headers);
        headers.set('X-Request-Id', requestId);

        return new NextResponse(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers,
        });
      } catch (error) {
        // Determine status code based on error type
        let statusCode = 500;

        if (isAppError(error)) {
          statusCode = (error as AppError).statusCode;
        } else if (error instanceof SystemError) {
          // System errors typically indicate service unavailable
          statusCode = 503;
        }

        // Format error response
        const errorResponse = formatErrorResponse(error as Error, requestId);

        // Return error response with appropriate status code
        return NextResponse.json(errorResponse, {
          status: statusCode,
          headers: {
            'X-Request-Id': requestId,
            'Content-Type': 'application/json',
          },
        });
      }
    };
  };
}

/**
 * Lightweight error boundary for non-API routes
 * Only logs errors without formatting responses
 */
export function withErrorLogging<T = unknown>(): Middleware<T> {
  return (handler: Handler<T>) => {
    return async (request: NextRequest, context: T): Promise<NextResponse> => {
      try {
        return await handler(request, context);
      } catch (error) {
        logError(`Error in ${request.nextUrl.pathname}`, error);
        throw error; // Re-throw to let Next.js handle it
      }
    };
  };
}
