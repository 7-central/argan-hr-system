'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';

type TabType = 'client-info' | 'contract-info';

interface ClientViewTabsContextValue {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

const ClientViewTabsContext = createContext<ClientViewTabsContextValue | undefined>(undefined);

export function ClientViewTabsProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<TabType>('client-info');

  return (
    <ClientViewTabsContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </ClientViewTabsContext.Provider>
  );
}

export function useClientViewTabs() {
  const context = useContext(ClientViewTabsContext);
  if (!context) {
    throw new Error('useClientViewTabs must be used within ClientViewTabsProvider');
  }
  return context;
}

export function ClientViewTabButtons() {
  const { activeTab, setActiveTab } = useClientViewTabs();

  return (
    <div className="flex gap-2 mr-12">
      <Button
        onClick={() => setActiveTab('client-info')}
        variant={activeTab === 'client-info' ? 'default' : 'outline'}
        className="w-40"
      >
        Client Information
      </Button>
      <Button
        onClick={() => setActiveTab('contract-info')}
        variant={activeTab === 'contract-info' ? 'default' : 'outline'}
        className="w-40"
      >
        Contract Information
      </Button>
    </div>
  );
}
