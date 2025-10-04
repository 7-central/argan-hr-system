import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Admin Users loading page component
 * Provides consistent loading state for the admin users page
 */
export default function UsersLoadingPage() {
  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
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
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4">
        {/* Page Header Skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" /> {/* Title */}
          <Skeleton className="h-10 w-32" /> {/* Add Admin button */}
        </div>

        {/* Table Skeleton - anticipating a users table */}
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" /> {/* Table header */}
          <Skeleton className="h-12 w-full" /> {/* Table row */}
          <Skeleton className="h-12 w-full" /> {/* Table row */}
          <Skeleton className="h-12 w-full" /> {/* Table row */}
          <Skeleton className="h-12 w-full" /> {/* Table row */}
        </div>
      </div>
    </SidebarInset>
  );
}
