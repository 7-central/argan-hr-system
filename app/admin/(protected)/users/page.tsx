// Force dynamic rendering for sidebar context
export const dynamic = 'force-dynamic';

import { validateSession } from '@/lib/utils/system/session';

import { AdminUserSearch } from '@/components/admin-user-search';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AdminPageWrapper } from '@/components/users/admin-page-wrapper';
import { UsersPageClient } from '@/components/users/users-page-client';

import { getUsers, deleteUser, reactivateUser } from './actions';

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Validate session and get current user role
  const session = await validateSession();

  if (!session) {
    // This shouldn't happen due to layout auth check, but TypeScript needs it
    return null;
  }

  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams.page) || 1;
  const search = typeof resolvedSearchParams.search === 'string' ? resolvedSearchParams.search : '';
  const limit = 25;

  // Check if user can manage admin users (SUPER_ADMIN or ADMIN)
  const canManageAdmins = session.role === 'SUPER_ADMIN' || session.role === 'ADMIN';

  try {
    // Fetch admin users using Server Action
    const result = await getUsers({
      page,
      limit,
      search: search || undefined,
    });

    const admins = result.admins;
    const totalCount = result.pagination.totalCount;
    const totalPages = result.pagination.totalPages;
    const offset = (page - 1) * limit;

    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        {/* Breadcrumbs */}
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

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Admin Users</h1>
          <UsersPageClient isSuperAdmin={canManageAdmins} />
        </div>

        {/* Permission Notice for READ_ONLY users */}
        {!canManageAdmins && (
          <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950">
            <CardContent className="p-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Note:</strong> Only SUPER_ADMIN and ADMIN users can create, edit, or deactivate admin
                users. You have <strong>{session.role}</strong> permissions (read-only access).
              </p>
            </CardContent>
          </Card>
        )}

        {/* Search Bar */}
        <AdminUserSearch />

        {/* Optimistic Admin List */}
        <AdminPageWrapper
          admins={admins}
          currentUserRole={session.role}
          search={search}
          deleteUserAction={deleteUser}
          reactivateUserAction={reactivateUser}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {offset + 1} to {Math.min(offset + limit, totalCount)} of {totalCount} admin
              users
            </p>
            <div className="flex items-center space-x-2">
              {page > 1 && (
                <Button variant="outline" size="sm" asChild>
                  <a href={`?page=${page - 1}${search ? `&search=${encodeURIComponent(search)}` : ''}`}>
                    Previous
                  </a>
                </Button>
              )}
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <Button variant="outline" size="sm" asChild>
                  <a href={`?page=${page + 1}${search ? `&search=${encodeURIComponent(search)}` : ''}`}>
                    Next
                  </a>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('Failed to load admin users:', error);

    // Return error fallback UI
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-2">Error Loading Admin Users</h2>
            <p className="text-sm text-muted-foreground">
              We encountered an error while loading the admin user list. Please try refreshing the
              page or contact support if the problem persists.
            </p>
            {error instanceof Error && (
              <p className="text-sm text-red-600 mt-2">Error: {error.message}</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }
}
