import Link from 'next/link';

import { Plus, ArrowLeft } from 'lucide-react';

import { clientService } from '@/lib/services/business/client.service';

import { InternalDocsTable } from '@/components/internal-docs/internal-docs-table';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';

export default async function ClientDocumentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const search = typeof resolvedSearchParams.search === 'string' ? resolvedSearchParams.search : '';

  // Fetch actual client data
  const client = await clientService.getClientById(Number(id));
  const clientName = client.companyName;

  // Placeholder data - will be replaced with S3 bucket data
  // These documents represent files stored in S3 organized by client folders
  const documents = [
    {
      id: 'DOC-001',
      type: 'Contract',
      version: 'V1.0',
      title: 'Service Agreement 2024.pdf',
      uploadedAt: new Date('2024-03-15T10:30:00'),
    },
    {
      id: 'DOC-002',
      type: 'Policy',
      version: 'V2.1',
      title: 'Employee Handbook.pdf',
      uploadedAt: new Date('2024-03-10T14:45:00'),
    },
    {
      id: 'DOC-003',
      type: 'Payroll',
      version: 'V1.0',
      title: 'Payroll Summary March 2024.xlsx',
      uploadedAt: new Date('2024-03-08T09:15:00'),
    },
    {
      id: 'DOC-004',
      type: 'Policy',
      version: 'V1.5',
      title: 'Health & Safety Policy.pdf',
      uploadedAt: new Date('2024-02-28T11:20:00'),
    },
    {
      id: 'DOC-005',
      type: 'Training',
      version: 'V1.0',
      title: 'Training Records Q1 2024.xlsx',
      uploadedAt: new Date('2024-02-15T16:00:00'),
    },
    {
      id: 'DOC-006',
      type: 'Contract',
      version: 'V1.2',
      title: 'NDA Standard Template.docx',
      uploadedAt: new Date('2024-02-10T08:30:00'),
    },
    {
      id: 'DOC-007',
      type: 'Form',
      version: 'V1.0',
      title: 'Client Onboarding Checklist.pdf',
      uploadedAt: new Date('2024-01-25T13:15:00'),
    },
    {
      id: 'DOC-008',
      type: 'Compliance',
      version: 'V2.0',
      title: 'GDPR Compliance Report 2024.pdf',
      uploadedAt: new Date('2024-01-20T10:45:00'),
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
            <BreadcrumbLink href="/admin/clients">Clients</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/admin/clients/${id}`}>{clientName}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Internal Documents Repository</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page Header with Back Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/clients">
            <Button variant="outline" size="icon" className="h-10 w-10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Internal Documents Repository</h1>
            <p className="text-sm text-muted-foreground">{clientName}</p>
          </div>
        </div>
        <Button className="w-[200px]">
          <Plus className="mr-2 h-4 w-4" />
          Add New Document
        </Button>
      </div>

      {/* Documents Table */}
      <InternalDocsTable documents={documents} search={search} />
    </div>
  );
}
