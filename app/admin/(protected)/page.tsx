import { Suspense } from "react"

// Force dynamic rendering for sidebar context
export const dynamic = 'force-dynamic'
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
  Plus,
  Download,
  FileSpreadsheet,
} from "lucide-react"
import { DashboardMetrics, RecentClients, MetricsSkeleton, RecentClientsSkeleton } from "@/components/dashboard"

/**
 * Admin Dashboard page with Suspense boundaries for loading states
 * Provides smooth loading experience with granular skeletons
 */
export default function AdminDashboard() {
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

        {/* Metrics Cards with Suspense */}
        <Suspense fallback={<MetricsSkeleton />}>
          <DashboardMetrics />
        </Suspense>

        {/* Main Content Area */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          {/* Recent Clients with Suspense */}
          <Suspense fallback={<RecentClientsSkeleton />}>
            <RecentClients />
          </Suspense>

          {/* Quick Actions - Static content, no loading needed */}
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
}