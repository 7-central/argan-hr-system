import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Calendar,
  PieChart,
  PoundSterling,
  Users,
} from "lucide-react"
import { dashboardService } from "@/lib/business/services"

/**
 * Dashboard metrics component that fetches and displays key metrics
 * Can be wrapped in Suspense for granular loading states
 */
export async function DashboardMetrics() {
  const metrics = await dashboardService.getDashboardMetrics()

  const totalActiveClients = metrics.totalActiveClients
  const tierCounts = metrics.serviceTierBreakdown
  const totalMonthlyRevenue = metrics.totalMonthlyRevenue
  const upcomingRenewals = metrics.upcomingRenewals

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Active Clients
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalActiveClients}</div>
          <p className="text-xs text-muted-foreground">
            Active clients in system
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Service Tier Breakdown
          </CardTitle>
          <PieChart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {tierCounts.TIER_1}/{tierCounts.DOC_ONLY}/{tierCounts.AD_HOC}
          </div>
          <p className="text-xs text-muted-foreground">
            Tier 1 / Doc Only / Ad-hoc
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Monthly Revenue
          </CardTitle>
          <PoundSterling className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            £{totalMonthlyRevenue.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <p className="text-xs text-muted-foreground">
            Total monthly retainer value
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Upcoming Renewals
          </CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{upcomingRenewals}</div>
          <p className="text-xs text-muted-foreground">
            Next 30 days
          </p>
        </CardContent>
      </Card>
    </div>
  )
}