import { Plus } from 'lucide-react';


import { ClientSearch } from '@/components/client-search';
import { ClientPageWrapper } from '@/components/clients/client-page-wrapper';
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

import { getClients } from './actions';

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams.page) || 1;
  const search = typeof resolvedSearchParams.search === 'string' ? resolvedSearchParams.search : '';
  const limit = 25;

  try {
    // Fetch clients using Server Action
    const result = await getClients({
      page,
      limit,
      search: search || undefined,
    });

    const clients = result.clients;
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
              <BreadcrumbPage>Clients</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Clients</h1>
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            Add New Client (Coming Soon)
          </Button>
        </div>

        {/* Search Bar */}
        <ClientSearch />

        {/* Optimistic Client List */}
        <ClientPageWrapper clients={clients} search={search} />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {offset + 1} to {Math.min(offset + limit, totalCount)} of {totalCount} clients
            </p>
            <div className="flex items-center space-x-2">
              {page > 1 && (
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={`?page=${page - 1}${search ? `&search=${encodeURIComponent(search)}` : ''}`}
                  >
                    Previous
                  </a>
                </Button>
              )}
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={`?page=${page + 1}${search ? `&search=${encodeURIComponent(search)}` : ''}`}
                  >
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
    console.error('Failed to load clients:', error);

    // Return error fallback UI
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-2">Error Loading Clients</h2>
            <p className="text-sm text-muted-foreground">
              We encountered an error while loading the client list. Please try refreshing the page
              or contact support if the problem persists.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
}
