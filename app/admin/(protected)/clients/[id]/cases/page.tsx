import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ArrowLeft } from 'lucide-react';

import { clientService } from '@/lib/services/business/client.service';

import { CasesPageContent } from '@/components/cases/cases-page-content';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';

interface ClientCasesPageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Client Cases Page
 * Manages cases for a specific client with nested organization
 */
export default async function ClientCasesPage({ params }: ClientCasesPageProps) {
  const { id: idString } = await params;

  // Convert string ID to number
  const id = parseInt(idString, 10);

  // Validate ID is a valid number
  if (isNaN(id) || id < 1) {
    notFound();
  }

  // Fetch client data to get company name
  let client;
  try {
    client = await clientService.getClientById(id);
  } catch {
    // Client not found - return 404
    notFound();
  }

  // TODO: Fetch cases for this client
  const cases: never[] = [];

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
            <BreadcrumbLink href="/admin/clients">Clients</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/admin/clients/${id}`}>{client.companyName}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Cases</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/clients">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Client Cases</h1>
          <p className="text-muted-foreground">{client.companyName}</p>
        </div>
      </div>

      {/* Cases Content */}
      <CasesPageContent clientId={id} clientName={client.companyName} cases={cases} />
    </div>
  );
}
