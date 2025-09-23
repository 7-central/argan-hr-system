import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * Skeleton component specifically for recent clients section
 * Used as fallback for Suspense boundary around RecentClients
 */
export function RecentClientsSkeleton() {
  return (
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
  )
}