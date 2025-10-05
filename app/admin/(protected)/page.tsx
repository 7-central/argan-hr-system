import { Suspense } from 'react';

import Link from 'next/link';

import { Plus, Download, FileSpreadsheet, TrendingUp, Shield, Briefcase, AlertTriangle } from 'lucide-react';

import { validateSession } from '@/lib/utils/system/session';

import {
  DashboardMetrics,
  RecentClients,
  MetricsSkeleton,
  RecentClientsSkeleton,
} from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Admin Dashboard page with Suspense boundaries for loading states
 * Provides smooth loading experience with granular skeletons
 */
export default async function AdminDashboard() {
  // Get session to access user's first name
  const session = await validateSession();

  // Extract first name from full name
  const firstName = session?.name.split(' ')[0] || 'Admin';
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Argan HR Dashboard</h1>
        <div className="text-sm text-muted-foreground pr-1">Welcome back, {firstName}</div>
      </div>

      {/* New Quick Actions */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <Button>Add New Client</Button>
            <Button>Add Case</Button>
            <Button>Record Interaction</Button>
          </div>
        </CardContent>
      </Card>

      {/* New Metrics Cards - Placeholders */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Client and Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Coming soon</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance and Obligations</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Coming soon</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Operational Workload</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Coming soon</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risks and Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Coming soon</p>
          </CardContent>
        </Card>
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
            <Button disabled className="w-full justify-start">
              <Plus className="mr-2 h-4 w-4" />
              Add New Client (Coming Soon)
            </Button>
            <Link href="/admin/clients" className="w-full">
              <Button variant="outline" className="w-full justify-start">
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                View All Clients
              </Button>
            </Link>
            <Button variant="outline" className="w-full justify-start">
              <Download className="mr-2 h-4 w-4" />
              Export Client List
            </Button>
            <div className="mt-4 rounded-lg bg-muted p-3">
              <p className="text-sm font-medium">System Status</p>
              <p className="text-xs text-muted-foreground">All systems operational</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
