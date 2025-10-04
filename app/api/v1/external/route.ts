/**
 * External API Endpoint (Placeholder)
 * This endpoint is designed to be called by external services
 * (webhooks, microservices, mobile apps, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandling } from '@/lib/middleware/withErrorHandling';
import { withRateLimit } from '@/lib/middleware/withRateLimit';
import { withRequestLogging } from '@/lib/middleware/withRequestLogging';

/**
 * Handler: GET external data
 * This is the actual work - happens after middleware
 */
async function getExternalHandler(_request: NextRequest) {
  return NextResponse.json({
    message: 'Hello stinkpot',
    timestamp: new Date().toISOString(),
    endpoint: '/api/v1/external',
    version: 'v1',
  });
}

/**
 * Handler: POST external data
 * This is the actual work - happens after middleware
 */
async function postExternalHandler(request: NextRequest) {
  const body = await request.json();

  return NextResponse.json({
    message: 'External POST received',
    receivedData: body,
    timestamp: new Date().toISOString(),
  });
}

// Apply middleware layers: error handling -> rate limiting -> logging
export const GET = withErrorHandling()(
  withRateLimit({ maxRequests: 100, windowMinutes: 1 })(withRequestLogging()(getExternalHandler))
);

export const POST = withErrorHandling()(
  withRateLimit({ maxRequests: 100, windowMinutes: 1 })(withRequestLogging()(postExternalHandler))
);
