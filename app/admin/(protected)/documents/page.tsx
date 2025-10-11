import { DocumentsPageContent } from '@/components/documents/documents-page-content';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

import { getClientsForDocuments } from './actions';

/**
 * Document Management Page
 * Manages documents for all clients with nested organization
 */
export default async function DocumentsPage() {
  // Fetch all clients for document management
  const clientsResponse = await getClientsForDocuments();
  const clients = clientsResponse.clients;

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
            <BreadcrumbPage>Document Management</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Document Management</h1>
      </div>

      {/* Client Search and Documents List */}
      <DocumentsPageContent clients={clients} />
    </div>
  );
}
