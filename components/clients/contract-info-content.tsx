'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { Calendar, CreditCard, SquarePen, PoundSterling } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Contract {
  id: number;
  contractStartDate: Date | string;
  contractRenewalDate: Date | string;
  lastPriceIncrease: Date | string | null;
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
  hrAdminRateNotNeeded: boolean;
  employmentLawRate: number | null;
  employmentLawRateUnit: string | null;
  employmentLawRateNotNeeded: boolean;
  mileageRate: number | null;
  mileageRateNotNeeded: boolean;
  overnightRate: number | null;
  overnightRateNotNeeded: boolean;
}

interface ContractInfoContentProps {
  contract: Contract | null;
  clientId: number;
  formatDate: (date: Date | string | null) => string;
}

export function ContractInfoContent({ contract, clientId, formatDate }: ContractInfoContentProps) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);

  const toggleRateNotNeeded = async (field: string, currentValue: boolean) => {
    if (!contract) return;

    setUpdating(true);
    try {
      const response = await fetch(`/api/clients/${clientId}/onboarding`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'contract',
          field,
          value: !currentValue,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update rate');
      }

      // Refresh the page data
      router.refresh();
    } catch (error) {
      console.error('Error updating rate:', error);
    } finally {
      setUpdating(false);
    }
  };

  if (!contract) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">No active contract found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Contract Dates */}
      <Card className="relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 h-8 w-8 hover:text-green-600 transition-colors"
          disabled
        >
          <SquarePen className="h-4 w-4" />
        </Button>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Contract Dates
          </CardTitle>
          <CardDescription>Contract period and renewal information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Contract Start Date</p>
              <p className="text-lg mt-1">{formatDate(contract.contractStartDate)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Contract Renewal Date</p>
              <p className="text-lg mt-1">{formatDate(contract.contractRenewalDate)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Last Price Increase</p>
              <p className="text-lg mt-1">{formatDate(contract.lastPriceIncrease)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment & Admin */}
      <Card className="relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 h-8 w-8 hover:text-green-600 transition-colors"
          disabled
        >
          <SquarePen className="h-4 w-4" />
        </Button>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment & Administration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Payment Method</p>
              <p className="text-lg mt-1">
                {contract.paymentMethod === 'DIRECT_DEBIT' ? 'Direct Debit' : 'Invoice'}
              </p>
            </div>
            {contract.paymentMethod === 'DIRECT_DEBIT' && (
              <>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Direct Debit Setup</p>
                  <p className="text-lg mt-1">{contract.directDebitSetup ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Direct Debit Confirmed</p>
                  <p className="text-lg mt-1">{contract.directDebitConfirmed ? 'Yes' : 'No'}</p>
                </div>
              </>
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground">Signed Contract Received</p>
              <p className="text-lg mt-1">{contract.signedContractReceived ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Contract Uploaded</p>
              <p className="text-lg mt-1">{contract.contractUploaded ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Added to Xero</p>
              <p className="text-lg mt-1">{contract.contractAddedToXero ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Agreement */}
      <Card className="relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 h-8 w-8 hover:text-green-600 transition-colors"
          disabled
        >
          <SquarePen className="h-4 w-4" />
        </Button>
        <CardHeader>
          <CardTitle>Agreed Service (In Scope)</CardTitle>
          <CardDescription>Inclusive hours and services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">HR Admin Inclusive Hours</p>
                <p className="text-lg mt-1">{contract.hrAdminInclusiveHours || '-'} hours</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Employment Law Inclusive Hours</p>
                <p className="text-lg mt-1">{contract.employmentLawInclusiveHours || '-'} hours</p>
              </div>
            </div>
            {contract.inclusiveServices.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Inclusive Services</p>
                <ul className="list-disc list-inside space-y-1">
                  {contract.inclusiveServices.map((service, index) => (
                    <li key={index} className="text-lg">{service}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Extra Rates */}
      <Card className="relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 h-8 w-8 hover:text-green-600 transition-colors"
          disabled
        >
          <SquarePen className="h-4 w-4" />
        </Button>
        <CardHeader>
          <CardTitle>Extra Rates (Out of Scope)</CardTitle>
          <CardDescription>Ad-hoc service rates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* HR Admin Rate */}
            <div>
              <p className="text-sm font-medium text-muted-foreground">HR Admin Rate</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-lg">
                  {contract.hrAdminRate !== null
                    ? `£${contract.hrAdminRate} ${contract.hrAdminRateUnit === 'HOURLY' ? 'per hour' : 'per day'}`
                    : contract.hrAdminRateNotNeeded
                    ? 'Not needed'
                    : '-'}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-6 w-6 ${
                    contract.hrAdminRate !== null || contract.hrAdminRateNotNeeded
                      ? 'text-green-600 hover:text-green-700'
                      : 'text-gray-400 hover:text-gray-500'
                  } transition-colors`}
                  onClick={() => toggleRateNotNeeded('hrAdminRateNotNeeded', contract.hrAdminRateNotNeeded)}
                  disabled={updating || contract.hrAdminRate !== null}
                  title={contract.hrAdminRate !== null ? 'Rate is set' : contract.hrAdminRateNotNeeded ? 'Mark as needed' : 'Mark as not needed'}
                >
                  <PoundSterling className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Employment Law Rate */}
            <div>
              <p className="text-sm font-medium text-muted-foreground">Employment Law Rate</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-lg">
                  {contract.employmentLawRate !== null
                    ? `£${contract.employmentLawRate} ${contract.employmentLawRateUnit === 'HOURLY' ? 'per hour' : 'per day'}`
                    : contract.employmentLawRateNotNeeded
                    ? 'Not needed'
                    : '-'}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-6 w-6 ${
                    contract.employmentLawRate !== null || contract.employmentLawRateNotNeeded
                      ? 'text-green-600 hover:text-green-700'
                      : 'text-gray-400 hover:text-gray-500'
                  } transition-colors`}
                  onClick={() => toggleRateNotNeeded('employmentLawRateNotNeeded', contract.employmentLawRateNotNeeded)}
                  disabled={updating || contract.employmentLawRate !== null}
                  title={contract.employmentLawRate !== null ? 'Rate is set' : contract.employmentLawRateNotNeeded ? 'Mark as needed' : 'Mark as not needed'}
                >
                  <PoundSterling className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Mileage Rate */}
            <div>
              <p className="text-sm font-medium text-muted-foreground">Mileage Rate</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-lg">
                  {contract.mileageRate !== null
                    ? `£${contract.mileageRate} per mile`
                    : contract.mileageRateNotNeeded
                    ? 'Not needed'
                    : '-'}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-6 w-6 ${
                    contract.mileageRate !== null || contract.mileageRateNotNeeded
                      ? 'text-green-600 hover:text-green-700'
                      : 'text-gray-400 hover:text-gray-500'
                  } transition-colors`}
                  onClick={() => toggleRateNotNeeded('mileageRateNotNeeded', contract.mileageRateNotNeeded)}
                  disabled={updating || contract.mileageRate !== null}
                  title={contract.mileageRate !== null ? 'Rate is set' : contract.mileageRateNotNeeded ? 'Mark as needed' : 'Mark as not needed'}
                >
                  <PoundSterling className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Overnight Rate */}
            <div>
              <p className="text-sm font-medium text-muted-foreground">Overnight Rate</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-lg">
                  {contract.overnightRate !== null
                    ? `£${contract.overnightRate} per night`
                    : contract.overnightRateNotNeeded
                    ? 'Not needed'
                    : '-'}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-6 w-6 ${
                    contract.overnightRate !== null || contract.overnightRateNotNeeded
                      ? 'text-green-600 hover:text-green-700'
                      : 'text-gray-400 hover:text-gray-500'
                  } transition-colors`}
                  onClick={() => toggleRateNotNeeded('overnightRateNotNeeded', contract.overnightRateNotNeeded)}
                  disabled={updating || contract.overnightRate !== null}
                  title={contract.overnightRate !== null ? 'Rate is set' : contract.overnightRateNotNeeded ? 'Mark as needed' : 'Mark as not needed'}
                >
                  <PoundSterling className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
