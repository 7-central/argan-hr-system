'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { AlertTriangle, Loader2 } from 'lucide-react';

import { deleteContract } from '@/lib/actions/contract.actions';

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


import type { Contract } from '@/lib/types/contract';

interface DeleteContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: Contract;
  clientId: number;
}

/**
 * Delete Contract Dialog
 * Confirms deletion with warning - only allows deletion of DRAFT contracts
 */
export function DeleteContractDialog({
  open,
  onOpenChange,
  contract,
  clientId,
}: DeleteContractDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleConfirm = async () => {
    setIsLoading(true);

    try {
      const result = await deleteContract(clientId, contract.id);

      if (result.success) {
        // Close dialog
        onOpenChange(false);

        // Redirect to contracts list page after deletion
        router.push(`/admin/clients/${clientId}/contracts`);
        router.refresh();
      } else {
        alert(`Failed to delete contract: ${result.error || 'An unexpected error occurred'}`);
      }
    } catch (error) {
      alert(`Failed to delete contract: ${error instanceof Error ? error.message : 'An unexpected error occurred'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Draft Contract?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this draft contract?
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Warning about permanent deletion */}
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This action cannot be undone. The contract will be permanently deleted from the system.
            {contract.status !== 'DRAFT' && (
              <>
                <br />
                <br />
                <strong>Note:</strong> Only DRAFT contracts can be deleted. This contract has status:{' '}
                {contract.status}
              </>
            )}
          </AlertDescription>
        </Alert>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading || contract.status !== 'DRAFT'}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Contract'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
