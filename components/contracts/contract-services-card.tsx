import { CheckCircle2, XCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';

import type { Contract } from '@/lib/types/contract';

interface ContractServicesCardProps {
  contract: Contract;
}

/**
 * Format rate with unit
 */
function formatRate(rate: number | null, unit: string | null, notNeeded?: boolean): string {
  if (notNeeded) return 'Not Needed';
  if (!rate || !unit) return 'Not set';
  return `£${rate} / ${unit === 'HOURLY' ? 'hour' : 'day'}`;
}

/**
 * Contract Services Card
 * Displays in-scope and out-of-scope services and rates
 */
export function ContractServicesCard({ contract }: ContractServicesCardProps) {
  return (
    <div className="space-y-8">
      {/* In Scope Services */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          In Scope Services (Inclusive)
        </h3>

        <div className="space-y-4">
          {/* Inclusive Hours */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">HR Admin Inclusive Hours</p>
              <p className="text-base">
                {contract.hrAdminInclusiveHours ? `${contract.hrAdminInclusiveHours} hours` : 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Employment Law Inclusive Hours
              </p>
              <p className="text-base">
                {contract.employmentLawInclusiveHours
                  ? `${contract.employmentLawInclusiveHours} hours`
                  : 'Not set'}
              </p>
            </div>
          </div>

          {/* Inclusive Services */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Inclusive Services</p>
            {contract.inclusiveServicesInScope && contract.inclusiveServicesInScope.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {contract.inclusiveServicesInScope.map((service, index) => (
                  <Badge key={index} variant="secondary" className="text-sm">
                    {service}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No services specified</p>
            )}
          </div>
        </div>
      </div>

      {/* Out of Scope Services */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <XCircle className="h-5 w-5 text-amber-600" />
          Out of Scope Services (Additional Rates)
        </h3>

        <div className="space-y-4">
          {/* Additional Rates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">HR Admin Rate</p>
              <p className="text-base">
                {formatRate(
                  contract.hrAdminRate,
                  contract.hrAdminRateUnit,
                  contract.hrAdminRateNotNeeded
                )}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Employment Law Rate</p>
              <p className="text-base">
                {formatRate(
                  contract.employmentLawRate,
                  contract.employmentLawRateUnit,
                  contract.employmentLawRateNotNeeded
                )}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Mileage Rate</p>
              <p className="text-base">
                {contract.mileageRateNotNeeded
                  ? 'Not Needed'
                  : contract.mileageRate
                    ? `£${contract.mileageRate} / mile`
                    : 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Overnight Rate</p>
              <p className="text-base">
                {contract.overnightRateNotNeeded
                  ? 'Not Needed'
                  : contract.overnightRate
                    ? `£${contract.overnightRate}`
                    : 'Not set'}
              </p>
            </div>
          </div>

          {/* Out of Scope Services */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Out of Scope Services</p>
            {contract.inclusiveServicesOutOfScope &&
            contract.inclusiveServicesOutOfScope.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {contract.inclusiveServicesOutOfScope.map((service, index) => (
                  <Badge key={index} variant="outline" className="text-sm">
                    {service}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No services specified</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
