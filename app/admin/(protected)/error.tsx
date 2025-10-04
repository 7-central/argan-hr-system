'use client';

import { useEffect } from 'react';

import { AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <Card className="border-destructive/50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <AlertTriangle className="h-6 w-6 text-destructive mt-1" />
              <div className="flex-1 space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">Something went wrong</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    We encountered an unexpected error. This could be due to a temporary connection
                    issue or server problem. Please try again.
                  </p>
                </div>

                {process.env.NODE_ENV === 'development' && error.message && (
                  <div className="rounded-md bg-muted p-3">
                    <p className="text-xs font-mono text-muted-foreground">{error.message}</p>
                  </div>
                )}

                <div className="flex space-x-3">
                  <Button onClick={reset} variant="default">
                    Try Again
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="/admin">Return to Dashboard</a>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </SidebarInset>
  );
}
