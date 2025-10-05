'use client';

import { ContactType } from '@prisma/client';

import { ClientInfoContent } from './client-info-content';
import { useClientViewTabs } from './client-view-tabs';
import { ContractInfoContent } from './contract-info-content';

interface Contact {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string | null;
  type: ContactType;
}

interface Contract {
  id: number;
  contractStartDate: string;
  contractRenewalDate: string;
  lastPriceIncrease: string | null;
  status: string;
  paymentMethod: string;
  directDebitSetup: boolean;
  directDebitConfirmed: boolean;
  signedContractReceived: boolean;
  contractUploaded: boolean;
  contractAddedToXero: boolean;
  hrAdminInclusiveHours: number | null;
  employmentLawInclusiveHours: number | null;
  inclusiveServices: string[];
  hrAdminRate: number | null;
  hrAdminRateUnit: string | null;
  employmentLawRate: number | null;
  employmentLawRateUnit: string | null;
  mileageRate: number | null;
  overnightRate: number | null;
}

interface Client {
  id: number;
  companyName: string;
  businessId: string | null;
  sector: string | null;
  serviceTier: string;
  monthlyRetainer: number | null;
  status: string;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  postcode: string | null;
  country: string | null;
  contacts: Contact[];
  contracts: Contract[];
}

interface ClientViewContentProps {
  client: Client;
}

// Helper functions moved to client component
const getServiceTierLabel = (tier: string): string => {
  switch (tier) {
    case 'TIER_1':
      return 'Tier 1 - Full Service';
    case 'DOC_ONLY':
      return 'Doc Only - Documentation';
    case 'AD_HOC':
      return 'Ad-hoc - As Needed';
    default:
      return tier;
  }
};

const formatDate = (date: Date | string | null): string => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

export function ClientViewContent({ client }: ClientViewContentProps) {
  const { activeTab } = useClientViewTabs();

  // Get active contract
  const activeContract = client.contracts && client.contracts.length > 0 ? client.contracts[0] : null;

  return (
    <>
      {activeTab === 'client-info' && (
        <ClientInfoContent client={client} getServiceTierLabel={getServiceTierLabel} />
      )}
      {activeTab === 'contract-info' && (
        <ContractInfoContent contract={activeContract} formatDate={formatDate} />
      )}
    </>
  );
}
