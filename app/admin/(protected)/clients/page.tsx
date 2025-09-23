// Force dynamic rendering for sidebar context
export const dynamic = 'force-dynamic'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Plus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { clientService } from "@/lib/business/services"
import { ClientSearch } from "@/components/client-search"
import { ClientPageWrapper } from "@/components/clients/client-page-wrapper"

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedSearchParams = await searchParams
  const page = Number(resolvedSearchParams.page) || 1
  const search = typeof resolvedSearchParams.search === 'string' ? resolvedSearchParams.search : ''
  const limit = 25

  try {
    // Fetch clients using the service
    const result = await clientService.getClients({
      page,
      limit,
      search: search || undefined
    })

    const clients = result.clients
    const totalCount = result.pagination.totalCount
    const totalPages = result.pagination.totalPages
    const offset = (page - 1) * limit
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
                <BreadcrumbLink href="/admin">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Clients</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Clients</h1>
          <Button asChild>
            <a href="/admin/clients/new">
              <Plus className="mr-2 h-4 w-4" />
              Add New Client
            </a>
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
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <a href={`?page=${page - 1}${search ? `&search=${encodeURIComponent(search)}` : ''}`}>
                    Previous
                  </a>
                </Button>
              )}
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <a href={`?page=${page + 1}${search ? `&search=${encodeURIComponent(search)}` : ''}`}>
                    Next
                  </a>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </SidebarInset>
    )
  } catch (error) {
    console.error('Failed to load clients:', error)

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
                  <BreadcrumbLink href="/admin">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Clients</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-2">Error Loading Clients</h2>
              <p className="text-sm text-muted-foreground">
                We encountered an error while loading the client list.
                Please try refreshing the page or contact support if the problem persists.
              </p>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    )
  }
}