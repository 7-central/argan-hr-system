// Request logging middleware
// Logs incoming requests and outgoing responses for monitoring

import { NextRequest, NextResponse } from 'next/server';
import type { Handler, Middleware } from './compose';
import { logInfo, logWarn } from '@/lib/system/logger';

/**
 * Extract relevant request information for logging
 */
function extractRequestInfo(request: NextRequest) {
  return {
    method: request.method,
    url: request.nextUrl.pathname,
    query: Object.fromEntries(request.nextUrl.searchParams.entries()),
    ip: request.headers.get('x-forwarded-for') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
  };
}

/**
 * Request/Response logging middleware
 * Logs all API requests with timing information
 */
export function withRequestLogging<T = unknown>(): Middleware<T> {
  return (handler: Handler<T>) => {
    return async (request: NextRequest, context?: T): Promise<NextResponse> => {
      const startTime = Date.now();
      const requestInfo = extractRequestInfo(request);

      // Log incoming request
      logInfo('Incoming request', requestInfo);

      try {
        // Execute handler
        const response = await handler(request, context);

        // Calculate response time
        const duration = Date.now() - startTime;

        // Log successful response
        logInfo('Request completed', {
          ...requestInfo,
          status: response.status,
          duration: `${duration}ms`,
        });

        // Add timing header
        const headers = new Headers(response.headers);
        headers.set('X-Response-Time', `${duration}ms`);

        return new NextResponse(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers,
        });
      } catch (error) {
        // Calculate response time even for errors
        const duration = Date.now() - startTime;

        // Log failed request
        logWarn('Request failed', {
          ...requestInfo,
          duration: `${duration}ms`,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        // Re-throw to let error handling middleware deal with it
        throw error;
      }
    };
  };
}

/**
 * Lightweight access log for high-traffic endpoints
 * Only logs method, path, and status code
 */
export function withAccessLog<T = unknown>(): Middleware<T> {
  return (handler: Handler<T>) => {
    return async (request: NextRequest, context?: T): Promise<NextResponse> => {
      const start = Date.now();

      const response = await handler(request, context);

      // Simple access log format
      const duration = Date.now() - start;
      console.log(
        `${request.method} ${request.nextUrl.pathname} ${response.status} ${duration}ms`
      );

      return response;
    };
  };
}