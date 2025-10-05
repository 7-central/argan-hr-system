import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ArrowLeft } from 'lucide-react';

import { clientService } from '@/lib/services/business/client.service';

import { ClientViewContent } from '@/components/clients/client-view-content';
import { ClientViewTabsProvider, ClientViewTabButtons } from '@/components/clients/client-view-tabs';
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
}

export default async function ClientViewPage({ params }: ClientViewPageProps) {
  const { id: idString } = await params;

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

  // Serialize for Client Components (convert Decimals to numbers, Dates to ISO strings)
  const client = {
    ...clientData,
    monthlyRetainer: clientData.monthlyRetainer ? Number(clientData.monthlyRetainer) : null,
    contacts: clientData.contacts,
    contracts: clientData.contracts.map((contract) => ({
      ...contract,
      contractStartDate: contract.contractStartDate.toISOString(),
      contractRenewalDate: contract.contractRenewalDate.toISOString(),
      lastPriceIncrease: contract.lastPriceIncrease?.toISOString() || null,
      hrAdminInclusiveHours: contract.hrAdminInclusiveHours ? Number(contract.hrAdminInclusiveHours) : null,
      employmentLawInclusiveHours: contract.employmentLawInclusiveHours ? Number(contract.employmentLawInclusiveHours) : null,
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
    <ClientViewTabsProvider>
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
              <BreadcrumbPage>{client.companyName}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/clients">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{client.companyName}</h1>
              <p className="text-sm text-muted-foreground">Client Details</p>
            </div>
          </div>
          <ClientViewTabButtons />
        </div>

        {/* Tabbed Content */}
        <ClientViewContent client={client} />
      </div>
    </ClientViewTabsProvider>
  );
}
