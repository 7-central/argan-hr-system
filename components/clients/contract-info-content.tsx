'use client';

import { Calendar, CreditCard, SquarePen } from 'lucide-react';

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

export function ContractInfoContent({ contract, clientId: _clientId, formatDate }: ContractInfoContentProps) {
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
              <p className="text-lg mt-1">
                {contract.hrAdminRate !== null
                  ? `£${contract.hrAdminRate} ${contract.hrAdminRateUnit === 'HOURLY' ? 'per hour' : 'per day'}`
                  : '-'}
              </p>
            </div>

            {/* Employment Law Rate */}
            <div>
              <p className="text-sm font-medium text-muted-foreground">Employment Law Rate</p>
              <p className="text-lg mt-1">
                {contract.employmentLawRate !== null
                  ? `£${contract.employmentLawRate} ${contract.employmentLawRateUnit === 'HOURLY' ? 'per hour' : 'per day'}`
                  : '-'}
              </p>
            </div>

            {/* Mileage Rate */}
            <div>
              <p className="text-sm font-medium text-muted-foreground">Mileage Rate</p>
              <p className="text-lg mt-1">
                {contract.mileageRate !== null
                  ? `£${contract.mileageRate} per mile`
                  : '-'}
              </p>
            </div>

            {/* Overnight Rate */}
            <div>
              <p className="text-sm font-medium text-muted-foreground">Overnight Rate</p>
              <p className="text-lg mt-1">
                {contract.overnightRate !== null
                  ? `£${contract.overnightRate} per night`
                  : '-'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
