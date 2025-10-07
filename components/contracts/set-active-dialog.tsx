'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { AlertCircle, Loader2 } from 'lucide-react';

import { setActiveContract } from '@/lib/actions/contract.actions';

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

interface SetActiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: Contract;
  clientId: number;
  currentActiveContract?: Contract | null;
}

/**
 * Set Active Contract Dialog
 * Confirms action and archives current active contract before setting new one
 */
export function SetActiveDialog({
  open,
  onOpenChange,
  contract,
  clientId,
  currentActiveContract,
}: SetActiveDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleConfirm = async () => {
    setIsLoading(true);

    try {
      const result = await setActiveContract(clientId, contract.id);

      if (result.success) {
        // Close dialog
        onOpenChange(false);

        // Refresh the page to show updated data
        router.refresh();
      } else {
        alert(`Failed to activate contract: ${result.error || 'An unexpected error occurred'}`);
      }
    } catch (error) {
      alert(`Failed to activate contract: ${error instanceof Error ? error.message : 'An unexpected error occurred'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Set as Active Contract?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to set <strong>v{contract.version}</strong> as the active contract
            for this client?
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Warning if there's a current active contract */}
        {currentActiveContract && (
          <div className="flex gap-3 items-start p-4 rounded-lg border border-red-200 bg-red-50">
            <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-base text-red-900">
              If you proceed, the current active contract <strong>v{currentActiveContract.version}</strong> will be automatically archived.
            </p>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting Active...
              </>
            ) : (
              'Set as Active'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
