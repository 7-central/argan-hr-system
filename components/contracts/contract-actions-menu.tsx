'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { Eye, SquarePen, Star } from 'lucide-react';

import { SetActiveDialog } from '@/components/contracts/set-active-dialog';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import type { Contract } from '@/lib/types/contract';

interface ContractActionsMenuProps {
  contract: Contract;
  clientId: number;
  currentActiveContract?: Contract | null;
}

/**
 * Contract Actions Menu Component
 * Displays action icons for each contract row
 */
export function ContractActionsMenu({
  contract,
  clientId,
  currentActiveContract,
}: ContractActionsMenuProps) {
  const router = useRouter();
  const [setActiveOpen, setSetActiveOpen] = useState(false);

  const isActive = contract.status === 'ACTIVE';
  const isArchived = contract.status === 'ARCHIVED';

  /**
   * Navigate to contract detail page
   */
  const handleView = () => {
    router.push(`/admin/clients/${clientId}/contracts/${contract.id}`);
  };

  /**
   * Navigate to contract detail page in edit mode
   */
  const handleEdit = () => {
    router.push(`/admin/clients/${clientId}/contracts/${contract.id}?edit=true`);
  };

  /**
   * Open set active dialog
   */
  const handleSetActive = () => {
    setSetActiveOpen(true);
  };

  return (
    <div className="flex items-center justify-center gap-1">
      {/* View Icon */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-muted transition-colors"
            onClick={handleView}
          >
            <Eye className="h-4 w-4 text-black" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>View Contract</TooltipContent>
      </Tooltip>

      {/* Edit Icon */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 transition-colors ${
              isArchived
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-green-800 hover:text-green-600'
            }`}
            onClick={handleEdit}
            disabled={isArchived}
          >
            <SquarePen className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {isArchived ? 'Archived contracts cannot be edited' : 'Edit Contract'}
        </TooltipContent>
      </Tooltip>

      {/* Star Icon - Always visible, filled if active, outlined if not */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 transition-colors ${
              isActive
                ? 'text-yellow-500 hover:text-yellow-400'
                : 'text-yellow-500 hover:text-yellow-400'
            }`}
            onClick={handleSetActive}
            disabled={isActive}
          >
            <Star className={`h-4 w-4 ${isActive ? 'fill-yellow-500' : ''}`} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {isActive ? 'Active Contract' : 'Set as Active Contract'}
        </TooltipContent>
      </Tooltip>

      {/* Set Active Dialog */}
      <SetActiveDialog
        open={setActiveOpen}
        onOpenChange={setSetActiveOpen}
        contract={contract}
        clientId={clientId}
        currentActiveContract={currentActiveContract}
      />
    </div>
  );
}
