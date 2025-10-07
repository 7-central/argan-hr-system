import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ArrowLeft } from 'lucide-react';

import { getContract } from '@/lib/actions/contract.actions';
import { clientService } from '@/lib/services/business/client.service';

import { ContractDetailView } from '@/components/contracts/contract-detail-view';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';


interface ContractDetailPageProps {
  params: Promise<{
    id: string;
    contractId: string;
  }>;
  searchParams: Promise<{
    edit?: string;
  }>;
}

/**
 * Contract Detail Page
 * Displays full details of a specific contract with tabbed interface
 */
export default async function ContractDetailPage({ params, searchParams }: ContractDetailPageProps) {
  const { id, contractId: contractIdParam } = await params;
  const { edit } = await searchParams;
  const clientId = parseInt(id, 10);
  const contractId = parseInt(contractIdParam, 10);
  const editMode = edit === 'true';

  if (isNaN(clientId) || isNaN(contractId)) {
    notFound();
  }

  // Fetch client data for breadcrumbs
  const client = await clientService.getClientById(clientId);

  if (!client) {
    notFound();
  }

  // Fetch contract data
  const contractResult = await getContract(contractId);

  if (!contractResult.success || !contractResult.data) {
    notFound();
  }

  const contract = contractResult.data;

  // Verify contract belongs to this client
  if (contract.clientId !== clientId) {
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
            <BreadcrumbLink href={`/admin/clients/${clientId}`}>{client.companyName}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/admin/clients/${clientId}/contracts`}>Contracts</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>v{contract.version}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link href={`/admin/clients/${clientId}/contracts`}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{client.companyName}</h1>
          <p className="text-muted-foreground">Version {contract.version}</p>
        </div>
      </div>

      {/* Contract Detail View */}
      <ContractDetailView contract={contract} clientId={clientId} initialEditMode={editMode} />
    </div>
  );
}
