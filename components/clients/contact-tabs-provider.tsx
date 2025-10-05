'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

import { ContactType } from '@prisma/client';

interface ContactTabsContextValue {
  activeTab: ContactType;
  setActiveTab: (tab: ContactType) => void;
}

const ContactTabsContext = createContext<ContactTabsContextValue | undefined>(undefined);

export function ContactTabsProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<ContactType>('PRIMARY');

  return (
    <ContactTabsContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </ContactTabsContext.Provider>
  );
}

export function useContactTabs() {
  const context = useContext(ContactTabsContext);
  if (!context) {
    throw new Error('useContactTabs must be used within ContactTabsProvider');
  }
  return context;
}
