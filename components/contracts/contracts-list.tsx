'use client';

import { useMemo, useState } from 'react';

import { ArrowDown, ArrowUp, ArrowUpDown, ExternalLink } from 'lucide-react';

import { ContractActionsMenu } from '@/components/contracts/contract-actions-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import type { Contract } from '@/lib/types/contract';

interface ContractsListProps {
  contracts: Contract[];
  clientId: number;
}

/**
 * Get badge variant based on contract status
 */
function getStatusVariant(status: string): 'default' | 'secondary' | 'outline' {
  switch (status) {
    case 'ACTIVE':
      return 'default'; // Blue
    case 'DRAFT':
      return 'secondary'; // Gray
    case 'ARCHIVED':
      return 'outline'; // Light
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
 * Format version number as v1, v2, etc.
 */
function formatVersion(version: number): string {
  return `v${version}`;
}

/**
 * Status sort order (for primary sort)
 */
const STATUS_ORDER: Record<string, number> = {
  ACTIVE: 1,
  DRAFT: 2,
  ARCHIVED: 3,
};

type SortColumn = 'version' | 'contractNumber' | 'status';

/**
 * Contracts List Table Component
 * Displays all contracts for a client with actions and sorting
 */
export function ContractsList({ contracts, clientId }: ContractsListProps) {
  // Find the current active contract
  const activeContract = contracts.find((c) => c.status === 'ACTIVE') || null;

  // Sorting state
  const [sortColumn, setSortColumn] = useState<SortColumn>('status');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Handle column header click for sorting
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to ascending
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Render sort icon based on current sort state
  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    );
  };

  // Sort contracts with default: status (ACTIVE > DRAFT > ARCHIVED), then version DESC
  const sortedContracts = useMemo(() => {
    return [...contracts].sort((a, b) => {
      let comparison = 0;

      // Apply selected column sort
      if (sortColumn === 'version') {
        comparison = a.version - b.version;
      } else if (sortColumn === 'contractNumber') {
        comparison = a.contractNumber.localeCompare(b.contractNumber);
      } else if (sortColumn === 'status') {
        const aOrder = STATUS_ORDER[a.status] || 999;
        const bOrder = STATUS_ORDER[b.status] || 999;
        comparison = aOrder - bOrder;
      }

      // If primary sort is equal or we're sorting by status, apply secondary sort by version DESC
      if (comparison === 0 || sortColumn === 'status') {
        const versionComparison = b.version - a.version; // DESC (latest first)
        if (sortColumn === 'status') {
          // When sorting by status, version is secondary
          comparison = comparison === 0 ? versionComparison : comparison;
        } else {
          comparison = versionComparison;
        }
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [contracts, sortColumn, sortDirection]);

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center">
                <button
                  className="flex items-center justify-center w-full text-primary text-base font-semibold hover:text-primary/80 transition-colors"
                  onClick={() => handleSort('version')}
                >
                  Version
                  {getSortIcon('version')}
                </button>
              </TableHead>
              <TableHead className="text-center">
                <button
                  className="flex items-center justify-center w-full text-primary text-base font-semibold hover:text-primary/80 transition-colors"
                  onClick={() => handleSort('contractNumber')}
                >
                  Contract Number
                  {getSortIcon('contractNumber')}
                </button>
              </TableHead>
              <TableHead className="text-center">
                <button
                  className="flex items-center justify-center w-full text-primary text-base font-semibold hover:text-primary/80 transition-colors"
                  onClick={() => handleSort('status')}
                >
                  Status
                  {getSortIcon('status')}
                </button>
              </TableHead>
              <TableHead className="text-center text-primary text-base font-semibold">
                Active Contract URL
              </TableHead>
              <TableHead className="text-center text-primary text-base font-semibold">
                Signed Contract URL
              </TableHead>
              <TableHead className="text-center">
                <div className="text-primary text-base font-semibold text-center">Actions</div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedContracts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No contracts found
                </TableCell>
              </TableRow>
            ) : (
              sortedContracts.map((contract) => (
                <TableRow key={contract.id}>
                  {/* Version */}
                  <TableCell className="font-medium text-center">
                    {formatVersion(contract.version)}
                  </TableCell>

                  {/* Contract Number */}
                  <TableCell className="text-center">
                    {contract.contractNumber}
                  </TableCell>

                  {/* Status Badge */}
                  <TableCell className="text-center">
                    <Badge variant={getStatusVariant(contract.status)} className="w-full justify-center">
                      {getStatusText(contract.status)}
                    </Badge>
                  </TableCell>

                  {/* Active Contract URL */}
                  <TableCell className="text-center">
                    {contract.docUrl ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => window.open(contract.docUrl!, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 text-primary" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Open Active Contract</TooltipContent>
                      </Tooltip>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>

                  {/* Signed Contract URL */}
                  <TableCell className="text-center">
                    {contract.signedContractUrl ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => window.open(contract.signedContractUrl!, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 text-primary" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Open Signed Contract</TooltipContent>
                      </Tooltip>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-center">
                    <ContractActionsMenu
                      contract={contract}
                      clientId={clientId}
                      currentActiveContract={activeContract}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
