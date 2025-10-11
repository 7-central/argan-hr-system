import { Plus } from 'lucide-react';

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

export default async function InternalDocsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const search = typeof resolvedSearchParams.search === 'string' ? resolvedSearchParams.search : '';

  // Placeholder data - will be replaced with actual data later
  // Document IDs use format: INT-{batch}-{record} (e.g., INT-001-001)
  const documents = [
    {
      id: 'INT-001-001',
      type: 'Policy',
      version: 'V1.2',
      title: 'Employee Handbook 2024',
      uploadedAt: new Date('2024-01-15T10:30:00'),
    },
    {
      id: 'INT-001-002',
      type: 'Contract',
      version: 'V2.0',
      title: 'Standard Service Agreement',
      uploadedAt: new Date('2024-02-20T14:45:00'),
    },
    {
      id: 'INT-001-003',
      type: 'Template',
      version: 'V1.0',
      title: 'NDA Template - Standard',
      uploadedAt: new Date('2024-03-10T09:15:00'),
    },
    {
      id: 'INT-001-004',
      type: 'Policy',
      version: 'V1.5',
      title: 'GDPR Compliance Guide',
      uploadedAt: new Date('2024-01-25T11:20:00'),
    },
    {
      id: 'INT-001-005',
      type: 'Form',
      version: 'V1.1',
      title: 'Client Onboarding Form',
      uploadedAt: new Date('2024-02-05T16:00:00'),
    },
    {
      id: 'INT-001-006',
      type: 'Template',
      version: 'V2.3',
      title: 'Monthly Retainer Invoice Template',
      uploadedAt: new Date('2024-03-15T08:30:00'),
    },
  ];

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
            <BreadcrumbPage>Internal Documents Repository</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Internal Documents Repository</h1>
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
