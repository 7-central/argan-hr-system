import { Badge } from '@/components/ui/badge';

import type { Contract } from '@/lib/types/contract';

interface ContractInfoCardProps {
  contract: Contract;
}

/**
 * Get badge variant based on contract status
 */
function getStatusVariant(status: string): 'default' | 'secondary' | 'outline' {
  switch (status) {
    case 'ACTIVE':
      return 'default';
    case 'DRAFT':
      return 'secondary';
    case 'ARCHIVED':
      return 'outline';
    default:
      return 'secondary';
  }
}

/**
 * Get status display text
 */
function getStatusText(status: string): string {
  switch (status) {
    case 'ACTIVE':
      return 'Active';
    case 'DRAFT':
      return 'Draft';
    case 'ARCHIVED':
      return 'Archived';
    default:
      return status;
  }
}

/**
 * Contract Information Card
 * Displays core contract details in a grid layout
 */
export function ContractInfoCard({ contract }: ContractInfoCardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Contract Number */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-1">Contract Number</h3>
        <p className="text-base font-mono">{contract.contractNumber}</p>
      </div>

      {/* Version */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-1">Version</h3>
        <p className="text-base">v{contract.version}</p>
      </div>

      {/* Contract Status */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-1">Contract Status</h3>
        <Badge variant={getStatusVariant(contract.status)} className="text-sm">
          {getStatusText(contract.status)}
        </Badge>
      </div>

      {/* Contract Start Date */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-1">Contract Start Date</h3>
        <p className="text-base">
          {contract.contractStartDate
            ? new Date(contract.contractStartDate).toLocaleDateString('en-GB', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : 'Not set'}
        </p>
      </div>

      {/* Contract Renewal Date */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-1">Contract Renewal Date</h3>
        <p className="text-base">
          {contract.contractRenewalDate
            ? new Date(contract.contractRenewalDate).toLocaleDateString('en-GB', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : 'Not set'}
        </p>
      </div>
    </div>
  );
}
