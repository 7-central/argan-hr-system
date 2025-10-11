import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Plus, ArrowLeft } from 'lucide-react';

import { getClientContracts } from '@/lib/actions/contract.actions';
import { clientService } from '@/lib/services/business/client.service';

import { ContractsList } from '@/components/contracts/contracts-list';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';


interface ContractsPageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Contracts List Page
 * Displays all contracts for a specific client
 */
export default async function ContractsPage({ params }: ContractsPageProps) {
  const { id } = await params;
  const clientId = parseInt(id, 10);

  if (isNaN(clientId)) {
    notFound();
  }

  // Fetch client data for breadcrumbs and page header
  const client = await clientService.getClientById(clientId);

  if (!client) {
    notFound();
  }

  // Fetch all contracts for this client
  const contractsResult = await getClientContracts(clientId);

  if (!contractsResult.success) {
    throw new Error(contractsResult.error || 'Failed to fetch contracts');
  }

  const contracts = contractsResult.data || [];

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
            <BreadcrumbPage>Contracts</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/clients">
            <Button variant="outline" size="icon" className="h-10 w-10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{client.companyName}</h1>
            <p className="text-muted-foreground">Client Contracts</p>
          </div>
        </div>
        <Link href={`/admin/clients/${clientId}/contracts/new`}>
          <Button className="w-[180px]">
            <Plus className="mr-2 h-4 w-4" />
            Add New Contract
          </Button>
        </Link>
      </div>

      {/* Contracts Table */}
      {contracts.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/30">
          <p className="text-muted-foreground text-lg mb-4">No contracts found for this client</p>
          <Button asChild>
            <Link href={`/admin/clients/${clientId}/contracts/new`}>Create First Contract</Link>
          </Button>
        </div>
      ) : (
        <ContractsList contracts={contracts} clientId={clientId} />
      )}
    </div>
  );
}
