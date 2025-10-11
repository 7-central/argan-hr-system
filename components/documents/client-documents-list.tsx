'use client';

import { useState, useRef } from 'react';

import { useRouter } from 'next/navigation';

import { Plus, Upload, Eye } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  const router = useRouter();
  const [comingSoonDialogOpen, setComingSoonDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    // Trigger the file input click immediately for better responsiveness
    fileInputRef.current?.click();
    // Set the selected client for when the file is chosen
    setSelectedClient(client);
  };

  /**
   * Handle file selection
   */
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && selectedClient) {
      console.log('File selected:', file.name, 'for client:', selectedClient.companyName);
      // TODO: Handle file upload logic here
      // For now, just log the file details
      console.log('File details:', {
        name: file.name,
        size: file.size,
        type: file.type,
      });
    }
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-left text-primary text-base font-semibold">
                Client Name
              </TableHead>
              <TableHead className="text-center text-primary text-base font-semibold">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="h-24 text-center">
                  <div>
                    <p className="text-lg font-semibold">No clients found</p>
                    <p className="text-sm text-muted-foreground">
                      Add clients to start managing their documents
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client) => (
                <TableRow
                  key={client.id}
                  onClick={() => router.push(`/admin/documents/client/${client.id}`)}
                  className="cursor-pointer hover:bg-muted/50 transition-all duration-200"
                >
                  {/* Client Name */}
                  <TableCell className="font-medium text-left">
                    {client.companyName}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-muted transition-colors"
                            onClick={() => handleViewAllDocuments(client)}
                          >
                            <Eye className="h-4 w-4 text-black" />
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
                            className="h-8 w-8 text-purple-600 hover:text-purple-500 transition-colors"
                            onClick={() => handleUploadDocument(client)}
                          >
                            <Upload className="h-4 w-4" />
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
                            className="h-8 w-8 text-green-500 hover:text-green-400 transition-colors"
                            onClick={() => handleNewDocument(client)}
                          >
                            <Plus className="h-4 w-4" />
                            <span className="sr-only">Create New Document</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Create New Document</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

      {/* Hidden file input for upload */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
      />

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
