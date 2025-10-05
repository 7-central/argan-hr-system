'use client';

import { useEffect } from 'react';

import { AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Error Boundary for Document Management page
 * Handles errors gracefully with recovery options
 */
export default function DocumentsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service
    console.error('Document Management page error:', error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Error Loading Document Management</h2>
              <p className="text-sm text-muted-foreground mb-4">
                We encountered an error while loading the document management page. Please try again
                or contact support if the problem persists.
              </p>
              {error.digest && (
                <p className="text-xs text-muted-foreground mb-4">Error ID: {error.digest}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={() => reset()}>Try Again</Button>
              <Button variant="outline" onClick={() => (window.location.href = '/admin')}>
                Return to Dashboard
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
