'use client';

import { useState } from 'react';

import { Search } from 'lucide-react';

import { ClientCasesList } from '@/components/cases/client-cases-list';
import { Input } from '@/components/ui/input';

export interface CaseData {
  id: number;
  caseId: string;
  title: string;
  creationDate: string;
  status: 'OPEN' | 'AWAITING' | 'CLOSED';
  actionRequiredBy: 'ARGAN' | 'CLIENT' | 'CONTRACTOR' | 'EMPLOYEE' | 'THIRD_PARTY' | null;
  actionRequired: string | null;
  escalatedBy: string;
  assignedTo: string | null;
  description?: string | null;
  interactionCount?: number;
  fileCount?: number;
}

interface CasesPageContentProps {
  clientId: number;
  clientName: string;
  cases: CaseData[];
  showSearch?: boolean;
  selectedCaseId?: number;
}

/**
 * Cases Page Content Component
 * Manages the display and interaction of client cases
 */
export function CasesPageContent({ clientId, clientName, cases, showSearch = true, selectedCaseId }: CasesPageContentProps) {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="w-full">
      {showSearch && (
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search cases by ID, title, or contact..."
            className="pl-8 md:w-[300px] lg:w-[400px]"
          />
        </div>
      )}

      {/* Client Cases List */}
      <ClientCasesList
        clientId={clientId}
        clientName={clientName}
        cases={cases}
        searchTerm={searchTerm}
        autoExpandCaseId={selectedCaseId}
      />
    </div>
  );
}
