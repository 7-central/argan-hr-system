import { FileText, Upload, FolderOpen } from 'lucide-react';

import { ClientDocumentsList } from '@/components/documents/client-documents-list';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
        <Button disabled>
          <Upload className="mr-2 h-4 w-4" />
          Upload Document (Coming Soon)
        </Button>
      </div>

      {/* Placeholder Content */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Document Categories Placeholder */}
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <FileText className="h-5 w-5" />
              Client Documents
            </CardTitle>
            <CardDescription>Policies, contracts, and client-specific files</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">0 documents</p>
            <Button variant="outline" className="mt-4 w-full" disabled>
              Browse Documents
            </Button>
          </CardContent>
        </Card>

        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <FolderOpen className="h-5 w-5" />
              Templates
            </CardTitle>
            <CardDescription>Reusable document templates</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">0 templates</p>
            <Button variant="outline" className="mt-4 w-full" disabled>
              View Templates
            </Button>
          </CardContent>
        </Card>

        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <FileText className="h-5 w-5" />
              Recent Uploads
            </CardTitle>
            <CardDescription>Recently added documents</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No recent uploads</p>
            <Button variant="outline" className="mt-4 w-full" disabled>
              View All
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Client Documents List with nested accordions */}
      <ClientDocumentsList clients={clients} />
    </div>
  );
}
