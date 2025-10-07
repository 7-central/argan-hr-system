'use client';

import { useState } from 'react';

import { FileText, FolderOpen, Building2, Plus, Upload } from 'lucide-react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import type { Client } from '@/lib/types/client';

/**
 * Document type categories
 */
const DOCUMENT_TYPES = [
  { id: 'policies', name: 'Policies', tooltipLabel: 'Add Policy', icon: FileText },
  { id: 'handbooks', name: 'Handbooks', tooltipLabel: 'Add Handbook', icon: FolderOpen },
  { id: 'contracts', name: 'Contracts', tooltipLabel: 'Add Contract', icon: FileText },
  { id: 'internal', name: 'Internal Documents', tooltipLabel: 'Add Internal Document', icon: FileText },
  { id: 'archive', name: 'Archive', tooltipLabel: 'Add Archive Document', icon: FolderOpen },
] as const;

/**
 * Placeholder documents for each type
 * TODO: Replace with actual document data from database
 */
const PLACEHOLDER_DOCUMENTS: Record<string, Array<{ name: string; date: string; size: string }>> = {
  policies: [
    { name: 'Employee Handbook 2024.pdf', date: '2024-01-15', size: '2.4 MB' },
    { name: 'Data Protection Policy.pdf', date: '2024-02-01', size: '856 KB' },
  ],
  handbooks: [
    { name: 'Health & Safety Manual.pdf', date: '2024-01-10', size: '3.2 MB' },
  ],
  contracts: [
    { name: 'Service Agreement.pdf', date: '2024-03-01', size: '1.1 MB' },
  ],
  internal: [],
  archive: [],
};

interface ClientDocumentsListProps {
  clients: Client[];
}

/**
 * Client Documents List Component
 * Displays nested accordions: Clients → Document Types → Individual Documents
 */
export function ClientDocumentsList({ clients }: ClientDocumentsListProps) {
  /**
   * Calculate total document count for a client
   * Sums up all document type counts for this client
   */
  const getClientDocumentCount = (clientId: number): number => {
    // Sum up all document types for this client
    return DOCUMENT_TYPES.reduce((total, docType) => {
      return total + getTypeDocumentCount(clientId, docType.id);
    }, 0);
  };

  /**
   * Get document count for a specific type
   * TODO: Replace with actual count from database
   */
  const getTypeDocumentCount = (clientId: number, typeId: string): number => {
    // Placeholder: Use the placeholder documents length
    return PLACEHOLDER_DOCUMENTS[typeId]?.length || 0;
  };

  const [openClientId, setOpenClientId] = useState<string | undefined>(undefined);
  const [comingSoonDialogOpen, setComingSoonDialogOpen] = useState(false);

  /**
   * Handle generate new document
   */
  const handleGenerateDocument = (client: Client, docTypeId: string, docTypeName: string) => {
    console.log('Generate new document:', docTypeName, 'for client:', client.companyName);
    setComingSoonDialogOpen(true);
  };

  /**
   * Handle upload existing document
   */
  const handleUploadDocument = (client: Client, docTypeId: string, docTypeName: string) => {
    console.log('Upload document:', docTypeName, 'for client:', client.companyName);
    // TODO: Implement document upload flow
  };

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-primary">Client Documents</h2>
        </div>

        {clients.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No clients found</p>
            <p className="text-sm mt-1">Add clients to start managing their documents</p>
          </div>
        ) : (
          <Accordion
            type="single"
            collapsible
            className="w-full"
            value={openClientId}
            onValueChange={setOpenClientId}
          >
            {clients.map((client) => {
              const docCount = getClientDocumentCount(client.id);

              return (
                <AccordionItem key={client.id} value={String(client.id)}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{client.companyName}</span>
                      <Badge variant="outline" className="ml-2">
                        {docCount}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {/* Nested accordion for document types */}
                    <Accordion type="single" collapsible className="pl-4">
                      {DOCUMENT_TYPES.map((docType) => {
                        const typeCount = getTypeDocumentCount(client.id, docType.id);
                        const documents = PLACEHOLDER_DOCUMENTS[docType.id] || [];

                        return (
                          <AccordionItem
                            key={docType.id}
                            value={docType.id}
                            className="border-l-2 border-muted"
                          >
                            <div className="flex items-center pr-2">
                              <AccordionTrigger className="hover:no-underline py-3 pr-0 [&>svg]:mr-0 min-w-0">
                                <div className="flex items-center gap-2 flex-1">
                                  <docType.icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                  <span className="text-sm font-medium">{docType.name}</span>
                                </div>
                              </AccordionTrigger>

                              <div className="flex items-center gap-2 ml-auto pl-4 flex-shrink-0">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleGenerateDocument(client, docType.id, docType.name);
                                      }}
                                    >
                                      <Plus className="h-4 w-4 text-muted-foreground hover:text-primary" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>{docType.tooltipLabel}</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleUploadDocument(client, docType.id, docType.name);
                                      }}
                                    >
                                      <Upload className="h-4 w-4 text-muted-foreground hover:text-primary" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Upload Document</TooltipContent>
                                </Tooltip>

                                <Badge variant="secondary" className="text-xs min-w-[24px] justify-center">
                                  {typeCount}
                                </Badge>
                              </div>
                            </div>
                            <AccordionContent>
                              {/* Document list */}
                              <div className="pl-6 space-y-2">
                                {documents.length > 0 ? (
                                  documents.map((doc, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors"
                                    >
                                      <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        <div className="flex flex-col">
                                          <span className="text-sm">{doc.name}</span>
                                          <span className="text-xs text-muted-foreground">
                                            {doc.date} • {doc.size}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-sm text-muted-foreground py-2">
                                    No {docType.name.toLowerCase()} uploaded yet
                                  </p>
                                )}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </CardContent>

      {/* Coming Soon Dialog */}
      <Dialog open={comingSoonDialogOpen} onOpenChange={setComingSoonDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Document</DialogTitle>
            <DialogDescription>
              Generate document feature coming soon.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
