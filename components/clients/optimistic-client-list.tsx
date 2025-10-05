'use client';

import { useState, useMemo } from 'react';

import { Edit, Trash2, Eye, AlertCircle, Clock, ArrowUpDown, ArrowUp, ArrowDown, ClipboardCheck } from 'lucide-react';

import { useOptimisticClient } from '@/lib/hooks/useOptimisticClient';

import { OnboardingModal } from '@/components/clients/onboarding-modal';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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

import type { OptimisticClient } from '@/lib/hooks/useOptimisticClient';
import type { Client } from '@/lib/types/client';

/**
 * Props for the OptimisticClientList component
 */
export interface OptimisticClientListProps {
  /** Initial client data from server */
  clients: Client[];
  /** Search term for filtering results */
  search?: string;
  /** Callback when edit action is triggered */
  onEdit?: (client: Client) => void;
  /** Callback when view action is triggered */
  onView?: (client: Client) => void;
}

/**
 * Optimistic Client List Component
 * Provides immediate feedback for client operations with smooth error handling
 *
 * Features:
 * - Optimistic delete operations with instant visual feedback
 * - Pending state indicators for operations in progress
 * - Error state handling with rollback capability
 * - Integration with loading states from Story 2.1
 * - Smooth animations for state transitions
 */
export function OptimisticClientList({
  clients,
  search = '',
  onEdit,
  onView,
}: OptimisticClientListProps) {
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<'companyName' | 'sector' | 'serviceTier' | 'status'>('status');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [onboardingClientId, setOnboardingClientId] = useState<number | null>(null);

  // Initialize optimistic client management
  const { optimisticClients: rawOptimisticClients, deleteClientOptimistic } = useOptimisticClient(clients);

  // Handle column header click for sorting
  const handleSort = (column: 'companyName' | 'sector' | 'serviceTier' | 'status') => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to ascending
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Sort the optimistic clients based on current sort settings
  const optimisticClients = useMemo(() => {
    return [...rawOptimisticClients].sort((a, b) => {
      let aVal: string | number = '';
      let bVal: string | number = '';

      switch (sortColumn) {
        case 'companyName':
          aVal = a.companyName.toLowerCase();
          bVal = b.companyName.toLowerCase();
          break;
        case 'sector':
          aVal = (a.sector || '').toLowerCase();
          bVal = (b.sector || '').toLowerCase();
          break;
        case 'serviceTier':
          aVal = a.serviceTier;
          bVal = b.serviceTier;
          break;
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [rawOptimisticClients, sortColumn, sortDirection]);

  /**
   * Handle optimistic client deletion
   * Shows immediate feedback then handles server response
   */
  const handleDeleteClient = async (client: Client) => {
    setDeleteError(null);

    const result = await deleteClientOptimistic(client.id);

    if (!result.success) {
      // Show error message for failed deletion
      setDeleteError(result.error || 'Failed to delete client');
    }

    // Close dialog
    setClientToDelete(null);
  };

  /**
   * Get service tier display label
   */
  function getServiceTierLabel(tier: string): string {
    switch (tier) {
      case 'TIER_1':
        return 'Tier 1';
      case 'DOC_ONLY':
        return 'Doc Only';
      case 'AD_HOC':
        return 'Ad-hoc';
      default:
        return tier;
    }
  }

  /**
   * Get status badge variant
   */
  function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' {
    switch (status) {
      case 'ACTIVE':
        return 'default';
      case 'PENDING':
        return 'secondary';
      case 'INACTIVE':
        return 'destructive';
      default:
        return 'secondary';
    }
  }

  /**
   * Render sort icon based on current sort state
   */
  const getSortIcon = (column: 'companyName' | 'sector' | 'serviceTier' | 'status') => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    );
  };

  /**
   * Get optimistic state indicator
   */
  function getOptimisticIndicator(client: OptimisticClient) {
    if (!client._optimistic) return null;

    if (client._pending) {
      return (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3 animate-pulse" />
          Updating...
        </div>
      );
    }

    if (client._error) {
      return (
        <div className="flex items-center gap-1 text-xs text-red-500">
          <AlertCircle className="h-3 w-3" />
          Error
        </div>
      );
    }

    return null;
  }

  return (
    <>
      {/* Error Alert */}
      {deleteError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {deleteError}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteError(null)}
              className="ml-2"
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Client Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <button
                    className="flex items-center hover:text-foreground transition-colors"
                    onClick={() => handleSort('companyName')}
                  >
                    Client
                    {getSortIcon('companyName')}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    className="flex items-center hover:text-foreground transition-colors"
                    onClick={() => handleSort('sector')}
                  >
                    Sector
                    {getSortIcon('sector')}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    className="flex items-center hover:text-foreground transition-colors"
                    onClick={() => handleSort('serviceTier')}
                  >
                    Service Tier
                    {getSortIcon('serviceTier')}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    className="flex items-center hover:text-foreground transition-colors"
                    onClick={() => handleSort('status')}
                  >
                    Status
                    {getSortIcon('status')}
                  </button>
                </TableHead>
                <TableHead className="w-[180px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {optimisticClients.length > 0 ? (
                optimisticClients.map((client) => (
                  <TableRow
                    key={client.id}
                    onClick={() => onView?.(client)}
                    className={`
                      ${client._optimistic ? 'bg-muted/30' : ''}
                      ${client.status === 'INACTIVE' ? 'opacity-50' : ''}
                      ${client._pending ? 'animate-pulse' : ''}
                      cursor-pointer hover:bg-muted/50
                      transition-all duration-200
                    `}
                  >
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span className={client.status === 'INACTIVE' ? 'line-through' : ''}>
                          {client.companyName}
                        </span>
                        {getOptimisticIndicator(client)}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {client.sector || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="w-32 justify-center">
                        {getServiceTierLabel(client.serviceTier)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(client.status)} className="w-32 justify-center">
                        {client.status.charAt(0) + client.status.slice(1).toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:text-green-600 transition-colors"
                          onClick={() => onView?.(client)}
                          disabled={client._pending}
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:text-green-600 transition-colors"
                          onClick={() => onEdit?.(client)}
                          disabled={client._pending || client.status === 'INACTIVE'}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:text-green-600 transition-colors"
                          onClick={() => setOnboardingClientId(client.id)}
                          disabled={client._pending || client.status === 'INACTIVE'}
                        >
                          <ClipboardCheck className="h-4 w-4" />
                          <span className="sr-only">Onboarding</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:text-red-600 transition-colors"
                          onClick={() => setClientToDelete(client)}
                          disabled={client._pending || client.status === 'INACTIVE'}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    {search ? (
                      <div>
                        <p className="text-lg font-semibold">No clients found</p>
                        <p className="text-sm text-muted-foreground">
                          No clients match your search for &ldquo;{search}&rdquo;
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-lg font-semibold">No clients yet</p>
                        <p className="text-sm text-muted-foreground">
                          Add your first client to get started
                        </p>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!clientToDelete} onOpenChange={() => setClientToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-semibold">{clientToDelete?.companyName}</span>? This will set
              the client status to inactive. This action can be reversed later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => clientToDelete && handleDeleteClient(clientToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Client
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Onboarding Modal */}
      <OnboardingModal
        clientId={onboardingClientId}
        open={!!onboardingClientId}
        onOpenChange={(open) => !open && setOnboardingClientId(null)}
      />
    </>
  );
}
