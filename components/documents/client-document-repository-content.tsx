'use client';

import { useState, useMemo } from 'react';

import { Search, Eye, Download } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface Document {
  id: number;
  name: string;
  category: string;
  uploadedAt: string;
}

interface ClientDocumentRepositoryContentProps {
  documents: Document[];
  clientId: number;
}

export function ClientDocumentRepositoryContent({ documents, clientId: _clientId }: ClientDocumentRepositoryContentProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter documents based on search term
  const filteredDocuments = useMemo(() => {
    if (!searchTerm.trim()) return documents;

    const lowerSearch = searchTerm.toLowerCase();
    return documents.filter((doc) => {
      return (
        doc.name.toLowerCase().includes(lowerSearch) ||
        doc.category.toLowerCase().includes(lowerSearch)
      );
    });
  }, [documents, searchTerm]);

  const handleViewDocument = (doc: Document) => {
    console.log('View document:', doc.name);
    // TODO: Implement S3 document viewing
  };

  const handleDownloadDocument = (doc: Document) => {
    console.log('Download document:', doc.name);
    // TODO: Implement S3 document download
  };

  return (
    <>
      {/* Search Widget */}
      <Card className="border-0 shadow-none bg-white">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Search className="h-5 w-5" />
                Search Documents
              </CardTitle>
              <CardDescription>Find documents by name or category</CardDescription>
            </div>
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by document name or category..."
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Documents Table */}
      <Card className="border-0 shadow-none bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-left text-primary text-base font-semibold">
                  Document Name
                </TableHead>
                <TableHead className="text-center text-primary text-base font-semibold">
                  Category
                </TableHead>
                <TableHead className="text-center text-primary text-base font-semibold">
                  Uploaded
                </TableHead>
                <TableHead className="text-center text-primary text-base font-semibold">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <div>
                      <p className="text-lg font-semibold">No documents found</p>
                      <p className="text-sm text-muted-foreground">
                        {searchTerm
                          ? `No documents match your search for "${searchTerm}"`
                          : 'No documents available for this client'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredDocuments.map((doc) => (
                  <TableRow key={doc.id}>
                    {/* Document Name */}
                    <TableCell className="font-medium text-left">
                      {doc.name}
                    </TableCell>

                    {/* Category */}
                    <TableCell className="text-center">
                      {doc.category}
                    </TableCell>

                    {/* Uploaded Date */}
                    <TableCell className="text-center text-muted-foreground">
                      {new Date(doc.uploadedAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-muted transition-colors"
                              onClick={() => handleViewDocument(doc)}
                            >
                              <Eye className="h-4 w-4 text-black" />
                              <span className="sr-only">View Document</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>View Document</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-green-600 hover:text-green-500 transition-colors"
                              onClick={() => handleDownloadDocument(doc)}
                            >
                              <Download className="h-4 w-4" />
                              <span className="sr-only">Download Document</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Download Document</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
