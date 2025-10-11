import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ArrowLeft, AlertTriangle } from 'lucide-react';

import { clientService } from '@/lib/services/business/client.service';

import { ClientViewWrapper } from '@/components/clients/client-view-wrapper';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';

interface ClientViewPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    edit?: string;
    tab?: string;
  }>;
}

export default async function ClientViewPage({ params, searchParams }: ClientViewPageProps) {
  const { id: idString } = await params;
  const { edit, tab } = await searchParams;

  // Check if we're in edit mode
  const editMode = edit === 'true';

  // Convert string ID to number
  const id = parseInt(idString, 10);

  // Validate ID is a valid number
  if (isNaN(id) || id < 1) {
    notFound();
  }

  // Fetch client data
  let clientData;
  try {
    clientData = await clientService.getClientById(id);
  } catch {
    // Client not found - return 404
    notFound();
  }

  // Check for multiple active contracts (data integrity check)
  const activeContracts = clientData.contracts.filter((c) => c.status === 'ACTIVE');
  const hasMultipleActiveContracts = activeContracts.length > 1;

  // Serialize for Client Components (convert Decimals to numbers, Dates to ISO strings)
  const client = {
    ...clientData,
    monthlyRetainer: clientData.monthlyRetainer ? Number(clientData.monthlyRetainer) : null,
    lastPriceIncrease: clientData.lastPriceIncrease?.toISOString() || null,
    contacts: clientData.contacts,
    addresses: clientData.addresses,
    contracts: clientData.contracts.map((contract) => ({
      ...contract,
      contractStartDate: contract.contractStartDate.toISOString(),
      contractRenewalDate: contract.contractRenewalDate.toISOString(),
      hrAdminInclusiveHours: contract.hrAdminInclusiveHours ? Number(contract.hrAdminInclusiveHours) : null,
      employmentLawInclusiveHours: contract.employmentLawInclusiveHours ? Number(contract.employmentLawInclusiveHours) : null,
      inclusiveServicesInScope: contract.inclusiveServicesInScope,
      inclusiveServicesOutOfScope: contract.inclusiveServicesOutOfScope,
      hrAdminRate: contract.hrAdminRate ? Number(contract.hrAdminRate) : null,
      hrAdminRateNotNeeded: contract.hrAdminRateNotNeeded,
      employmentLawRate: contract.employmentLawRate ? Number(contract.employmentLawRate) : null,
      employmentLawRateNotNeeded: contract.employmentLawRateNotNeeded,
      mileageRate: contract.mileageRate ? Number(contract.mileageRate) : null,
      mileageRateNotNeeded: contract.mileageRateNotNeeded,
      overnightRate: contract.overnightRate ? Number(contract.overnightRate) : null,
      overnightRateNotNeeded: contract.overnightRateNotNeeded,
    })),
    audits: clientData.audits.map((audit) => ({
      ...audit,
      nextAuditDate: audit.nextAuditDate.toISOString(),
    })),
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      {/* Breadcrumbs */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem key="dashboard">
            <BreadcrumbLink href="/admin">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator key="sep-1" />
          <BreadcrumbItem key="clients">
            <BreadcrumbLink href="/admin/clients">Clients</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator key="sep-2" />
          <BreadcrumbItem key="client-name">
            <BreadcrumbPage>{client.companyName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Multiple Active Contracts Warning */}
      {hasMultipleActiveContracts && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Data Integrity Issue: Multiple Active Contracts</AlertTitle>
          <AlertDescription>
            This client has {activeContracts.length} active contracts. Only one contract should be active at a time.
            {activeContracts.length > 0 && (
              <span className="block mt-2">
                Active contracts:{' '}
                {activeContracts.map((c, i) => (
                  <span key={c.id}>
                    {c.contractNumber} (v{c.version})
                    {i < activeContracts.length - 1 && ', '}
                  </span>
                ))}
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Client View with Header Actions and Content */}
      <ClientViewWrapper
        client={client}
        editMode={editMode}
        initialTab={tab}
        backButton={
          <Link href="/admin/clients">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        }
      />
    </div>
  );
}
