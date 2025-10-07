import { Suspense } from 'react';

import Link from 'next/link';

import { TrendingUp, Shield, Briefcase, AlertTriangle } from 'lucide-react';

import { validateSession } from '@/lib/utils/system/session';

import {
  DashboardMetrics,
  MetricsSkeleton,
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
      <Card className="w-full border-0 shadow-none">
        <CardHeader>
          <CardTitle className="text-primary">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            <Link href="/admin/clients/new" className="w-full">
              <Button className="w-full">Add New Client</Button>
            </Link>
            <Button disabled>Add Case</Button>
            <Button disabled>Record Interaction</Button>
          </div>
        </CardContent>
      </Card>

      {/* New Metrics Cards - Placeholders */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Client and Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Coming soon</p>
          </CardContent>
        </Card>

        <Card className="border-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Compliance and Obligations</CardTitle>
            <Shield className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Coming soon</p>
          </CardContent>
        </Card>

        <Card className="border-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Operational Workload</CardTitle>
            <Briefcase className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Coming soon</p>
          </CardContent>
        </Card>

        <Card className="border-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Risks and Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-primary" />
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
        {/* Recent Clients Placeholder */}
        <Card className="col-span-full lg:col-span-4 border-primary">
          <CardHeader>
            <CardTitle className="text-primary">Recent Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Coming soon</p>
          </CardContent>
        </Card>

        {/* Quick Actions Placeholder */}
        <Card className="col-span-full lg:col-span-3 border-primary">
          <CardHeader>
            <CardTitle className="text-primary">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Coming soon</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
