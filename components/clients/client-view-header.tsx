'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { Calculator, ClipboardCheck, FileText } from 'lucide-react';

import { OnboardingModal } from '@/components/clients/onboarding-modal';
import { VatCalculatorModal } from '@/components/modals/vat-calculator-modal';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ClientViewHeaderProps {
  clientId: number;
  activeTab: string;
}

export function ClientViewHeader({ clientId, activeTab }: ClientViewHeaderProps) {
  const router = useRouter();
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [calculatorOpen, setCalculatorOpen] = useState(false);

  return (
    <div className="flex items-center gap-3">
      {/* Calculator icon - only show on Contract and Service tab */}
      {activeTab === 'contract-service' && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-purple-600 hover:text-purple-700 transition-colors"
              onClick={() => setCalculatorOpen(true)}
            >
              <Calculator className="h-4 w-4" />
              <span className="sr-only">VAT Calculator</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>VAT Calculator</TooltipContent>
        </Tooltip>
      )}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-yellow-500 hover:text-yellow-600 transition-colors"
            onClick={() => setOnboardingOpen(true)}
          >
            <ClipboardCheck className="h-4 w-4" />
            <span className="sr-only">Onboarding</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Onboarding</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-blue-500 hover:text-blue-600 transition-colors"
            onClick={() => router.push(`/admin/clients/${clientId}/contracts`)}
          >
            <FileText className="h-4 w-4" />
            <span className="sr-only">View Contracts</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>View Contracts</TooltipContent>
      </Tooltip>

      {/* Onboarding Modal */}
      <OnboardingModal
        clientId={onboardingOpen ? clientId : null}
        open={onboardingOpen}
        onOpenChange={setOnboardingOpen}
      />

      {/* VAT Calculator Modal */}
      <VatCalculatorModal
        open={calculatorOpen}
        onOpenChange={setCalculatorOpen}
      />
    </div>
  );
}
