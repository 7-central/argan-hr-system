'use client';

import { useState, useMemo } from 'react';

import { ClientDocumentsList } from '@/components/documents/client-documents-list';
import { DocumentsPageWidgets } from '@/components/documents/documents-page-widgets';

import type { Client } from '@/lib/types/client';

interface DocumentsPageContentProps {
  clients: Client[];
}

export function DocumentsPageContent({ clients }: DocumentsPageContentProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter clients based on search term
  const filteredClients = useMemo(() => {
    if (!searchTerm.trim()) return clients;

    return clients.filter((client) =>
      client.companyName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clients, searchTerm]);

  return (
    <>
      {/* Client Search and Recent Searches Widgets */}
      <DocumentsPageWidgets clients={clients} onSearchChange={setSearchTerm} />

      {/* Client Documents List */}
      <ClientDocumentsList clients={filteredClients} />
    </>
  );
}
