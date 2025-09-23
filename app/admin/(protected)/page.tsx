import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  Calendar,
  PieChart,
  PoundSterling,
  Users,
  Plus,
  Download,
  FileSpreadsheet,
} from "lucide-react"
import { dashboardService } from "@/lib/business/services"

export default async function AdminDashboard() {
  try {
    // Fetch all dashboard metrics using the service
    const metrics = await dashboardService.getDashboardMetrics()
    const recentClients = await dashboardService.getRecentClients(3)

    // Extract data for display
    const totalActiveClients = metrics.totalActiveClients
    const tierCounts = metrics.serviceTierBreakdown
    const totalMonthlyRevenue = metrics.totalMonthlyRevenue
    const upcomingRenewals = metrics.upcomingRenewals

    return (
      <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Page Title */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="text-sm text-muted-foreground">
            Welcome back, Admin
          </div>
        </div>

        {/* Metrics Cards */}
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

        {/* Main Content Area */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          {/* Recent Clients */}
          <Card className="col-span-full lg:col-span-4">
            <CardHeader>
              <CardTitle>Recent Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {recentClients.length > 0 ? (
                  recentClients.map((client, index) => (
                    <div key={index} className="flex items-center">
                      <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {client.companyName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {client.contactEmail} • {
                            client.serviceTier === 'TIER_1' ? 'Tier 1' :
                            client.serviceTier === 'DOC_ONLY' ? 'Doc Only' :
                            'Ad-hoc'
                          }
                        </p>
                      </div>
                      <div className="ml-auto font-medium">
                        {client.status === 'ACTIVE' ? 'Active' :
                         client.status === 'INACTIVE' ? 'Inactive' :
                         'Pending'}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No clients yet. Add your first client to get started.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="col-span-full lg:col-span-3">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Button className="w-full justify-start">
                <Plus className="mr-2 h-4 w-4" />
                Add New Client
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                View All Clients
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Download className="mr-2 h-4 w-4" />
                Export Client List
              </Button>
              <div className="mt-4 rounded-lg bg-muted p-3">
                <p className="text-sm font-medium">System Status</p>
                <p className="text-xs text-muted-foreground">
                  All systems operational
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SidebarInset>
    )
  } catch (error) {
    console.error('Failed to load dashboard data:', error)

    // Return error fallback UI
    return (
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Card>
            <CardHeader>
              <CardTitle>Error Loading Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                We encountered an error while loading the dashboard data.
                Please try refreshing the page or contact support if the problem persists.
              </p>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    )
  }
}