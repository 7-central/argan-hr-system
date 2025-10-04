/**
 * Rate Limiting Middleware
 * Simple in-memory rate limiting for external API endpoints
 *
 * For production, this should use Redis or a database for distributed rate limiting
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * In-memory rate limit tracking
 * Key: IP address or API key
 * Value: { count: number, resetAt: number }
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Clean up expired entries periodically
 */
function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupExpiredEntries, 5 * 60 * 1000);

/**
 * Rate limiting middleware
 * Limits requests per IP address
 */
export function withRateLimit<T = unknown>(
  config: {
    maxRequests?: number;
    windowMinutes?: number;
  } = {}
): (
  handler: (request: NextRequest, context: T) => Promise<NextResponse> | NextResponse
) => (request: NextRequest, context: T) => Promise<NextResponse> {
  const maxRequests = config.maxRequests || 100;
  const windowMs = (config.windowMinutes || 1) * 60 * 1000;

  return (handler: (request: NextRequest, context: T) => Promise<NextResponse> | NextResponse) => {
    return async (request: NextRequest, context: T): Promise<NextResponse> => {
      // Get IP address from request
      const ip =
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

      const now = Date.now();
      const identifier = `ip:${ip}`;

      // Get or create rate limit entry
      let entry = rateLimitStore.get(identifier);

      if (!entry || now > entry.resetAt) {
        // Create new window
        entry = {
          count: 1,
          resetAt: now + windowMs,
        };
        rateLimitStore.set(identifier, entry);
      } else {
        // Increment count
        entry.count++;
      }

      // Check if limit exceeded
      if (entry.count > maxRequests) {
        const retryAfter = Math.ceil((entry.resetAt - now) / 1000);

        return NextResponse.json(
          {
            success: false,
            error: 'Rate limit exceeded',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter,
          },
          {
            status: 429,
            headers: {
              'Retry-After': retryAfter.toString(),
              'X-RateLimit-Limit': maxRequests.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': entry.resetAt.toString(),
            },
          }
        );
      }

      // Add rate limit headers
      const response = await handler(request, context);

      response.headers.set('X-RateLimit-Limit', maxRequests.toString());
      response.headers.set('X-RateLimit-Remaining', (maxRequests - entry.count).toString());
      response.headers.set('X-RateLimit-Reset', entry.resetAt.toString());

      return response;
    };
  };
}
