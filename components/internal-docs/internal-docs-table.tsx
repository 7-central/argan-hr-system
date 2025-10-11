'use client';

import { useState, useMemo } from 'react';

import { Eye, Download, Share2, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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

/**
 * Document type for internal docs
 */
export interface InternalDocument {
  id: string;
  type: string;
  version: string;
  title: string;
  uploadedAt: Date;
}

/**
 * Props for InternalDocsTable component
 */
export interface InternalDocsTableProps {
  documents: InternalDocument[];
  search?: string;
}

/**
 * Internal Documents Table Component
 * Displays internal company documents with search, sort, and actions
 */
export function InternalDocsTable({ documents, search: initialSearch = '' }: InternalDocsTableProps) {
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [sortColumn, setSortColumn] = useState<'type' | 'version' | 'title' | 'uploadedAt'>('type');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Handle column header click for sorting
  const handleSort = (column: 'type' | 'version' | 'title' | 'uploadedAt') => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to ascending
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Filter and sort documents
  const filteredAndSortedDocuments = useMemo(() => {
    // Filter by search term
    let filtered = documents;
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = documents.filter(
        (doc) =>
          doc.id.toLowerCase().includes(lowerSearch) ||
          doc.type.toLowerCase().includes(lowerSearch) ||
          doc.title.toLowerCase().includes(lowerSearch) ||
          doc.version.toLowerCase().includes(lowerSearch)
      );
    }

    // Sort with primary and secondary sort
    return [...filtered].sort((a, b) => {
      let aVal: string | number | Date = '';
      let bVal: string | number | Date = '';

      // Primary sort by selected column
      switch (sortColumn) {
        case 'type':
          aVal = a.type.toLowerCase();
          bVal = b.type.toLowerCase();
          break;
        case 'version':
          aVal = a.version.toLowerCase();
          bVal = b.version.toLowerCase();
          break;
        case 'title':
          aVal = a.title.toLowerCase();
          bVal = b.title.toLowerCase();
          break;
        case 'uploadedAt':
          aVal = a.uploadedAt.getTime();
          bVal = b.uploadedAt.getTime();
          break;
      }

      // Primary sort comparison
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;

      // Secondary sort: when primary values are equal, sort by uploadedAt (newest first)
      const aTime = a.uploadedAt.getTime();
      const bTime = b.uploadedAt.getTime();
      return bTime - aTime; // Descending order (newest first)
    });
  }, [documents, searchTerm, sortColumn, sortDirection]);

  /**
   * Render sort icon based on current sort state
   */
  const getSortIcon = (column: 'type' | 'version' | 'title' | 'uploadedAt') => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    );
  };

  /**
   * Get document type badge variant
   */
  const getTypeVariant = (type: string): 'default' | 'secondary' | 'outline' => {
    switch (type.toLowerCase()) {
      case 'policy':
        return 'default';
      case 'contract':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <>
      {/* Search Bar */}
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search documents by type, title, or version..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
        {searchTerm && (
          <Button variant="ghost" onClick={() => setSearchTerm('')}>
            Clear
          </Button>
        )}
      </div>

      {/* Documents Table */}
      <Card className="border-0 shadow-none">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">
                  <button
                    className="flex items-center justify-center w-full text-primary text-base font-semibold hover:text-primary/80 transition-colors"
                    onClick={() => handleSort('type')}
                  >
                    Type
                    {getSortIcon('type')}
                  </button>
                </TableHead>
                <TableHead className="text-center">
                  <button
                    className="flex items-center justify-center w-full text-primary text-base font-semibold hover:text-primary/80 transition-colors"
                    onClick={() => handleSort('version')}
                  >
                    Version
                    {getSortIcon('version')}
                  </button>
                </TableHead>
                <TableHead className="text-center">
                  <button
                    className="flex items-center justify-center w-full text-primary text-base font-semibold hover:text-primary/80 transition-colors"
                    onClick={() => handleSort('title')}
                  >
                    Document Title
                    {getSortIcon('title')}
                  </button>
                </TableHead>
                <TableHead className="text-center">
                  <button
                    className="flex items-center justify-center w-full text-primary text-base font-semibold hover:text-primary/80 transition-colors"
                    onClick={() => handleSort('uploadedAt')}
                  >
                    Uploaded At
                    {getSortIcon('uploadedAt')}
                  </button>
                </TableHead>
                <TableHead className="w-[220px] text-center text-primary text-base font-semibold">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedDocuments.length > 0 ? (
                filteredAndSortedDocuments.map((doc) => (
                  <TableRow key={doc.id} className="cursor-pointer hover:bg-muted/50 transition-all duration-200">
                    <TableCell className="text-center">
                      <Badge variant={getTypeVariant(doc.type)} className="w-28 justify-center">
                        {doc.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="w-20 justify-center">
                        {doc.version}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-center">{doc.title}</TableCell>
                    <TableCell className="text-sm text-muted-foreground text-center">
                      {formatDate(doc.uploadedAt)}
                    </TableCell>
                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-muted transition-colors"
                              onClick={() => console.log('View document:', doc.id)}
                            >
                              <Eye className="h-4 w-4 text-black" />
                              <span className="sr-only">View</span>
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
                              onClick={() => console.log('Download document:', doc.id)}
                            >
                              <Download className="h-4 w-4" />
                              <span className="sr-only">Download</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Download Document</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-purple-600 hover:text-purple-500 transition-colors"
                              onClick={() => console.log('Share document:', doc.id)}
                            >
                              <Share2 className="h-4 w-4" />
                              <span className="sr-only">Share</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Share Document</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-500 transition-colors"
                              onClick={() => console.log('Delete document:', doc.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Delete Document</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    {searchTerm ? (
                      <div>
                        <p className="text-lg font-semibold">No documents found</p>
                        <p className="text-sm text-muted-foreground">
                          No documents match your search for &ldquo;{searchTerm}&rdquo;
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-lg font-semibold">No documents yet</p>
                        <p className="text-sm text-muted-foreground">
                          Add your first document to get started
                        </p>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
