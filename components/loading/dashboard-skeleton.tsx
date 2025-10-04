import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Dashboard skeleton component that matches the exact layout of the dashboard page
 * Used for loading states while dashboard data is being fetched
 */
export function DashboardSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      {/* Page Title Skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>

      {/* Metrics Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Clients Skeleton */}
        <Card className="col-span-full lg:col-span-4">
          <CardHeader>
            <Skeleton className="h-6 w-28" />
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="ml-auto h-4 w-12" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Skeleton */}
        <Card className="col-span-full lg:col-span-3">
          <CardHeader>
            <Skeleton className="h-6 w-24" />
          </CardHeader>
          <CardContent className="grid gap-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
            <div className="mt-4 rounded-lg bg-muted p-3">
              <Skeleton className="h-4 w-20 mb-1" />
              <Skeleton className="h-3 w-32" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
