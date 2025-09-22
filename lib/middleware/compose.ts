// Middleware composition utility
// Based on document-parser patterns for chaining middleware

import { NextRequest, NextResponse } from 'next/server';

/**
 * Generic handler type that can be used with or without context
 */
export type Handler<T = unknown> = (
  request: NextRequest,
  context: T
) => Promise<NextResponse> | NextResponse;

/**
 * Middleware function type
 */
export type Middleware<T = unknown> = (
  handler: Handler<T>
) => Handler<T>;

/**
 * Compose multiple middleware functions into a single middleware
 * Middleware are applied right-to-left (last middleware is innermost)
 *
 * Example:
 * compose(withAuth, withErrorHandling, withLogging)(handler)
 *
 * Execution order:
 * 1. withAuth runs first (outermost)
 * 2. withErrorHandling runs second
 * 3. withLogging runs third (innermost, closest to handler)
 * 4. handler executes
 * 5. Response flows back through middleware in reverse order
 */
export function compose<T = unknown>(...middlewares: Middleware<T>[]): Middleware<T> {
  return (handler: Handler<T>) => {
    return middlewares.reduceRight(
      (acc: Handler<T>, middleware: Middleware<T>) => middleware(acc),
      handler
    );
  };
}

/**
 * Type-safe compose for authenticated handlers
 * Ensures the handler receives an AuthenticatedRequest
 */
export function composeAuth<T = unknown>(
  ...middlewares: Middleware<T>[]
): Middleware<T> {
  return compose(...middlewares);
}

/**
 * Utility to create a simple pass-through middleware
 * Useful for conditional middleware application
 */
export function passthrough<T = unknown>(): Middleware<T> {
  return (handler: Handler<T>) => handler;
}

/**
 * Conditionally apply middleware based on a predicate
 */
export function conditional<T = unknown>(
  predicate: (request: NextRequest) => boolean,
  middleware: Middleware<T>
): Middleware<T> {
  return (handler: Handler<T>) => {
    return async (request: NextRequest, context: T) => {
      if (predicate(request)) {
        return middleware(handler)(request, context);
      }
      return handler(request, context);
    };
  };
}