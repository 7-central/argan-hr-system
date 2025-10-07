import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ArrowLeft } from 'lucide-react';

import { clientService } from '@/lib/services/business/client.service';

import { ContractForm } from '@/components/forms/contract-form';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';

interface NewContractPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function NewContractPage({ params }: NewContractPageProps) {
  const { id: idString } = await params;

  // Convert string ID to number
  const id = parseInt(idString, 10);

  // Validate ID is a valid number
  if (isNaN(id) || id < 1) {
    notFound();
  }

  // Fetch minimal client data for header
  let clientData;
  let nextVersion = 1;
  try {
    clientData = await clientService.getClientById(id);

    // Calculate next version number
    nextVersion = clientData.contracts.length + 1;
  } catch {
    // Client not found - return 404
    notFound();
  }

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
            <BreadcrumbLink href={`/admin/clients/${id}`}>{clientData.companyName}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/admin/clients/${id}/contracts`}>Contracts</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>New Contract</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link href={`/admin/clients/${id}/contracts`}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">New Contract</h1>
          <p className="text-sm text-muted-foreground">Create a new contract for {clientData.companyName}</p>
        </div>
      </div>

      {/* Contract Form */}
      <ContractForm clientId={id} companyName={clientData.companyName} nextVersion={nextVersion} />
    </div>
  );
}
