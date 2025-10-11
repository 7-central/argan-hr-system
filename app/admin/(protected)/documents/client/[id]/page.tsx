import { notFound } from 'next/navigation';

import { clientService } from '@/lib/services/business/client.service';

import { ClientDocumentRepositoryContent } from '@/components/documents/client-document-repository-content';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface ClientDocumentRepositoryPageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Client Document Repository Page
 * Shows documents that Argan creates for the client's employees
 * (e.g., employee handbooks, policies, HR documents)
 * Stored in S3 bucket
 */
export default async function ClientDocumentRepositoryPage({ params }: ClientDocumentRepositoryPageProps) {
  const { id } = await params;
  const clientId = parseInt(id, 10);

  if (isNaN(clientId)) {
    notFound();
  }

  // Fetch client data
  const client = await clientService.getClientById(clientId);

  if (!client) {
    notFound();
  }

  // Placeholder documents - will be replaced with S3 bucket data
  // These are documents Argan creates FOR the client to give to their employees
  const placeholderDocuments = [
    {
      id: 1,
      name: 'Employee_Handbook_2024.pdf',
      category: 'Handbooks',
      uploadedAt: '2024-03-15',
    },
    {
      id: 2,
      name: 'Holiday_Policy.pdf',
      category: 'Policies',
      uploadedAt: '2024-03-10',
    },
    {
      id: 3,
      name: 'Sickness_Absence_Policy.pdf',
      category: 'Policies',
      uploadedAt: '2024-03-08',
    },
    {
      id: 4,
      name: 'Disciplinary_Procedure.pdf',
      category: 'Procedures',
      uploadedAt: '2024-02-28',
    },
    {
      id: 5,
      name: 'Grievance_Procedure.pdf',
      category: 'Procedures',
      uploadedAt: '2024-02-25',
    },
    {
      id: 6,
      name: 'Maternity_Paternity_Policy.pdf',
      category: 'Policies',
      uploadedAt: '2024-02-20',
    },
    {
      id: 7,
      name: 'Health_Safety_Policy.pdf',
      category: 'Policies',
      uploadedAt: '2024-02-15',
    },
    {
      id: 8,
      name: 'Code_of_Conduct.pdf',
      category: 'Policies',
      uploadedAt: '2024-02-10',
    },
  ];

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 bg-gray-50 min-h-screen">
      {/* Breadcrumbs */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin/documents">Client Documents</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{client.companyName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{client.companyName}</h1>
          <p className="text-muted-foreground">Document Repository</p>
        </div>
      </div>

      {/* Document Repository Content */}
      <ClientDocumentRepositoryContent documents={placeholderDocuments} clientId={clientId} />
    </div>
  );
}
