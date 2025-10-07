'use client';

import { useState } from 'react';

import { Copy, ExternalLink, FileText } from 'lucide-react';

import { Button } from '@/components/ui/button';

import type { Contract } from '@/lib/types/contract';

interface ContractDocumentsCardProps {
  contract: Contract;
}

/**
 * Contract Documents Card
 * Displays and manages contract document URLs
 */
export function ContractDocumentsCard({ contract }: ContractDocumentsCardProps) {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  /**
   * Copy URL to clipboard
   */
  const handleCopyUrl = async (url: string, label: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(label);

      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch {
      alert('Failed to copy URL to clipboard');
    }
  };

  /**
   * Open URL in new tab
   */
  const handleOpenUrl = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Active Contract URL */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-muted-foreground">Active Contract Document</h3>
        </div>
        {contract.docUrl ? (
          <div className="flex items-center gap-2">
            <div className="flex-1 p-3 bg-muted rounded-md">
              <p className="text-sm font-mono truncate">{contract.docUrl}</p>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleOpenUrl(contract.docUrl!)}
              title="Open in new tab"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleCopyUrl(contract.docUrl!, 'Active Contract')}
              title="Copy URL"
            >
              <Copy className={`h-4 w-4 ${copiedUrl === 'Active Contract' ? 'text-green-600' : ''}`} />
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">No active contract URL set</p>
        )}
      </div>

      {/* Signed Contract URL */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-muted-foreground">Signed Contract Document</h3>
        </div>
        {contract.signedContractUrl ? (
          <div className="flex items-center gap-2">
            <div className="flex-1 p-3 bg-muted rounded-md">
              <p className="text-sm font-mono truncate">{contract.signedContractUrl}</p>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleOpenUrl(contract.signedContractUrl!)}
              title="Open in new tab"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleCopyUrl(contract.signedContractUrl!, 'Signed Contract')}
              title="Copy URL"
            >
              <Copy className={`h-4 w-4 ${copiedUrl === 'Signed Contract' ? 'text-green-600' : ''}`} />
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">No signed contract URL set</p>
        )}
      </div>

      {/* Future: Upload functionality placeholder */}
      <div className="pt-4 border-t">
        <p className="text-xs text-muted-foreground">
          Note: Document upload functionality will be added in a future update. URLs can be set via
          the contract edit page.
        </p>
      </div>
    </div>
  );
}
