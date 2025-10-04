// Force dynamic rendering for sidebar context
export const dynamic = 'force-dynamic';

import { UserPlus } from 'lucide-react';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';

export default function AdminUsersPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Admin Users</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Admin Users</h1>
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Admin
          </Button>
        </div>

        {/* Placeholder Content */}
        <div className="flex-1 flex items-center justify-center rounded-lg border-2 border-dashed">
          <div className="text-center">
            <p className="text-lg font-semibold">Admin User Management</p>
            <p className="text-sm text-muted-foreground">
              User management will be implemented in a future story
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
