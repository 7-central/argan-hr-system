import { NextResponse } from 'next/server';

import { config } from './config';

/**
 * Standard API response interface for all endpoints
 * Ensures consistent structure across the application
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: unknown;
  };
  metadata?: {
    timestamp: string;
    version: string;
    requestId?: string;
  };
}

/**
 * Paginated API response interface
 * Extends the standard response with pagination metadata
 */
export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalCount: number;
  };
}

/**
 * ApiResponseBuilder - Utility for creating standardized API responses
 *
 * Provides consistent response format across all API endpoints with:
 * - Standard success/error structure
 * - Request tracking via requestId
 * - Version and timestamp metadata
 * - Type-safe response building
 *
 * Usage:
 * - ApiResponseBuilder.success(data, requestId) - Success responses
 * - ApiResponseBuilder.error(message, code, statusCode, details, requestId) - Error responses
 * - ApiResponseBuilder.paginated(data, pagination, requestId) - Paginated responses
 */
export class ApiResponseBuilder {
  /**
   * Create a successful API response
   */
  static success<T>(data: T, requestId?: string, statusCode: number = 200): NextResponse {
    const response: ApiResponse<T> = {
      success: true,
      data,
      metadata: {
        timestamp: new Date().toISOString(),
        version: config.api.version,
        requestId,
      },
    };

    return NextResponse.json(response, { status: statusCode });
  }

  /**
   * Create an error API response
   */
  static error(
    message: string,
    code: string,
    statusCode: number = 400,
    details?: unknown,
    requestId?: string
  ): NextResponse {
    const response: ApiResponse = {
      success: false,
      error: {
        message,
        code,
        details,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        version: config.api.version,
        requestId,
      },
    };

    return NextResponse.json(response, { status: statusCode });
  }

  /**
   * Create a paginated API response
   */
  static paginated<T>(
    data: T[],
    pagination: {
      page: number;
      limit: number;
      totalCount: number;
      totalPages: number;
    },
    requestId?: string
  ): NextResponse {
    const response: PaginatedApiResponse<T> = {
      success: true,
      data,
      pagination,
      metadata: {
        timestamp: new Date().toISOString(),
        version: config.api.version,
        requestId,
      },
    };

    return NextResponse.json(response);
  }

  /**
   * Create a simple success response (for infrastructure endpoints)
   */
  static simple<T>(data: T, statusCode: number = 200): Response {
    return Response.json(data, { status: statusCode });
  }
}

/**
 * Utility function to extract request ID from headers
 */
export function getRequestId(request: Request): string | undefined {
  return request.headers.get('x-request-id') || undefined;
}

/**
 * Type guard to check if response is an API response
 */
export function isApiResponse(obj: unknown): obj is ApiResponse {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    'success' in obj &&
    typeof (obj as { success: unknown }).success === 'boolean'
  );
}
