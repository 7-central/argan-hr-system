'use client';

import { useState } from 'react';

import { Building2, Plus, Upload, Eye } from 'lucide-react';

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

interface ClientDocumentsListProps {
  clients: Client[];
}

/**
 * Client Documents List Component
 * Displays list of clients with document action buttons
 */
export function ClientDocumentsList({ clients }: ClientDocumentsListProps) {
  const [comingSoonDialogOpen, setComingSoonDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<string>('');

  /**
   * Handle new document
   */
  const handleNewDocument = (client: Client) => {
    console.log('New document for client:', client.companyName);
    setDialogAction('Create New Document');
    setComingSoonDialogOpen(true);
  };

  /**
   * Handle upload document
   */
  const handleUploadDocument = (client: Client) => {
    console.log('Upload document for client:', client.companyName);
    setDialogAction('Upload Document');
    setComingSoonDialogOpen(true);
  };

  /**
   * Handle view all documents
   */
  const handleViewAllDocuments = (client: Client) => {
    console.log('View all documents for client:', client.companyName);
    setDialogAction('View All Documents');
    setComingSoonDialogOpen(true);
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
          <div className="space-y-2">
            {clients.map((client) => (
              <div
                key={client.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                {/* Client Name */}
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{client.companyName}</span>
                </div>

                {/* Action Icons */}
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 hover:bg-muted"
                        onClick={() => handleViewAllDocuments(client)}
                      >
                        <Eye className="h-5 w-5 text-black" />
                        <span className="sr-only">View All Documents</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>View All Documents</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-purple-600 hover:text-purple-500 hover:bg-purple-50"
                        onClick={() => handleUploadDocument(client)}
                      >
                        <Upload className="h-5 w-5" />
                        <span className="sr-only">Upload Document</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Upload Document</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-green-500 hover:text-green-400 hover:bg-green-50"
                        onClick={() => handleNewDocument(client)}
                      >
                        <Plus className="h-5 w-5" />
                        <span className="sr-only">Create New Document</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Create New Document</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Coming Soon Dialog */}
      <Dialog open={comingSoonDialogOpen} onOpenChange={setComingSoonDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{dialogAction}</DialogTitle>
            <DialogDescription>
              This feature is coming soon.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
