'use client';

import { useState, useMemo } from 'react';

import Link from 'next/link';

import { ArrowUpDown, ArrowUp, ArrowDown, Filter, Plus, MessageSquarePlus } from 'lucide-react';

import { CaseDetailsWidget } from '@/components/cases/case-details-widget';
import { CaseInteractionsWidget } from '@/components/cases/case-interactions-widget';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import type { CallLogCaseData } from '@/components/cases/call-log-content';

interface CallLogListProps {
  cases: CallLogCaseData[];
}

/**
 * Call Log List Component
 * Displays all cases across all clients in a sortable/filterable table
 */
export function CallLogList({ cases }: CallLogListProps) {
  const [selectedCase, setSelectedCase] = useState<CallLogCaseData | null>(null);
  const [sortColumn, setSortColumn] = useState<'caseId' | 'title' | 'clientName' | 'escalatedBy' | 'assignedTo' | 'lastInteractionDate' | 'status' | 'actionRequired' | 'creationDate'>('creationDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isTableVisible, setIsTableVisible] = useState(false); // Default: table hidden

  // Filters state
  const [filters, setFilters] = useState<Record<string, string[]>>({
    status: [],
    actionRequired: [],
    assignedTo: [],
    escalatedBy: [],
    clientName: [],
  });

  /**
   * Handle case click
   */
  const handleCaseClick = (caseItem: CallLogCaseData) => {
    setSelectedCase(caseItem);
  };

  /**
   * Handle column header click for sorting
   */
  const handleSort = (column: typeof sortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  /**
   * Toggle filter value
   */
  const toggleFilter = (column: string, value: string) => {
    setFilters(prev => {
      const currentFilters = prev[column] || [];
      const newFilters = currentFilters.includes(value)
        ? currentFilters.filter(v => v !== value)
        : [...currentFilters, value];

      return {
        ...prev,
        [column]: newFilters,
      };
    });
  };

  /**
   * Clear filter for a column
   */
  const clearFilter = (column: string) => {
    setFilters(prev => ({
      ...prev,
      [column]: [],
    }));
  };

  /**
   * Get unique values for a column
   */
  const getUniqueValues = (column: keyof CallLogCaseData) => {
    return [...new Set(cases.map(c => c[column]))].filter(Boolean).sort();
  };

  /**
   * Apply filters and sort cases
   */
  const filteredAndSortedCases = useMemo(() => {
    // First filter
    const filtered = cases.filter(caseItem => {
      // Apply each active filter
      for (const [column, selectedValues] of Object.entries(filters)) {
        if (selectedValues.length > 0) {
          const columnValue = caseItem[column as keyof typeof caseItem];
          if (!selectedValues.includes(String(columnValue))) {
            return false;
          }
        }
      }
      return true;
    });

    // Then sort
    return filtered.sort((a, b) => {
      let aVal: string | number = '';
      let bVal: string | number = '';

      switch (sortColumn) {
        case 'caseId':
          aVal = a.caseId;
          bVal = b.caseId;
          break;
        case 'title':
          aVal = a.title.toLowerCase();
          bVal = b.title.toLowerCase();
          break;
        case 'clientName':
          aVal = a.clientName.toLowerCase();
          bVal = b.clientName.toLowerCase();
          break;
        case 'escalatedBy':
          aVal = a.escalatedBy.toLowerCase();
          bVal = b.escalatedBy.toLowerCase();
          break;
        case 'assignedTo':
          aVal = a.assignedTo?.toLowerCase() || '';
          bVal = b.assignedTo?.toLowerCase() || '';
          break;
        case 'creationDate':
          // Parse DD/MM/YYYY to comparable format
          const [aDay, aMonth, aYear] = a.creationDate.split('/');
          const [bDay, bMonth, bYear] = b.creationDate.split('/');
          aVal = new Date(`${aYear}-${aMonth}-${aDay}`).getTime();
          bVal = new Date(`${bYear}-${bMonth}-${bDay}`).getTime();
          break;
        case 'lastInteractionDate':
          aVal = new Date(a.lastInteractionDateTime).getTime();
          bVal = new Date(b.lastInteractionDateTime).getTime();
          break;
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
        case 'actionRequired':
          aVal = a.actionRequired || '';
          bVal = b.actionRequired || '';
          break;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [cases, filters, sortColumn, sortDirection]);

  /**
   * Render sort icon based on current sort state
   */
  const getSortIcon = (column: typeof sortColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="ml-1 h-3.5 w-3.5 inline" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="ml-1 h-3.5 w-3.5 inline" />
    ) : (
      <ArrowDown className="ml-1 h-3.5 w-3.5 inline" />
    );
  };

  /**
   * Get status dot color
   */
  const getStatusDotColor = (status: string): string => {
    switch (status) {
      case 'OPEN':
        return 'bg-green-500';
      case 'AWAITING':
        return 'bg-amber-500';
      case 'CLOSED':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  /**
   * Get action required background color
   */
  const getActionRequiredColor = (actionRequired: string | null): string => {
    if (!actionRequired) {
      return 'bg-muted text-muted-foreground hover:bg-muted';
    }
    switch (actionRequired) {
      case 'ARGAN':
        return 'bg-green-100 text-green-700 hover:bg-green-200';
      case 'CLIENT':
        return 'bg-gray-100 text-gray-700 hover:bg-gray-200';
      case 'CONTRACTOR':
        return 'bg-blue-100 text-blue-700 hover:bg-blue-200';
      case 'EMPLOYEE':
        return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200';
      default:
        return 'bg-gray-100 text-gray-700 hover:bg-gray-200';
    }
  };

  return (
    <>
      {/* Full Width Widget - Cases List */}
      <Card className="w-full border-0 shadow-none bg-muted/80">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <Button
            onClick={() => setIsTableVisible(!isTableVisible)}
            variant={isTableVisible ? "outline" : "default"}
            size="sm"
            className="h-9"
          >
            {isTableVisible ? 'Hide all cases' : 'Show all cases'}
          </Button>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-9"
            >
              <MessageSquarePlus className="mr-2 h-4 w-4" />
              Log Interaction
            </Button>
            <Button
              size="sm"
              className="h-9"
            >
              <Plus className="mr-2 h-4 w-4" />
              Open New Case
            </Button>
          </div>
        </CardHeader>
        {isTableVisible && (
        <CardContent>
          {/* Scroll container - using the working pattern */}
          <div className="w-full overflow-auto" style={{ maxHeight: '400px' }}>
            <table className="w-full text-sm">
              <thead className="bg-background">
                <tr>
                  {/* Case ID */}
                  <th className="sticky top-0 bg-background backdrop-blur-sm p-3 text-left font-semibold border-b">
                    <button
                      className="flex items-center text-primary hover:text-primary/80 transition-colors"
                      onClick={() => handleSort('caseId')}
                    >
                      Case ID
                      {getSortIcon('caseId')}
                    </button>
                  </th>

                  {/* Case Title */}
                  <th className="sticky top-0 bg-background backdrop-blur-sm p-3 text-left font-semibold border-b">
                    <button
                      className="flex items-center text-primary hover:text-primary/80 transition-colors"
                      onClick={() => handleSort('title')}
                    >
                      Case Title
                      {getSortIcon('title')}
                    </button>
                  </th>

                  {/* Client */}
                  <th className="sticky top-0 bg-background backdrop-blur-sm p-3 text-center font-semibold border-b">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        className="flex items-center text-primary hover:text-primary/80 transition-colors"
                        onClick={() => handleSort('clientName')}
                      >
                        Client
                        {getSortIcon('clientName')}
                      </button>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="p-1 hover:bg-muted rounded">
                            <Filter className={`h-3.5 w-3.5 ${filters.clientName?.length > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64" align="center">
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            <div className="flex items-center justify-between sticky top-0 bg-popover pb-2">
                              <span className="text-sm font-medium">Filter Client</span>
                              {filters.clientName?.length > 0 && (
                                <button
                                  className="text-xs text-muted-foreground hover:text-foreground"
                                  onClick={() => clearFilter('clientName')}
                                >
                                  Clear
                                </button>
                              )}
                            </div>
                            {getUniqueValues('clientName').map((value) => (
                              <div key={String(value)} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`clientName-${value}`}
                                  checked={filters.clientName?.includes(String(value))}
                                  onCheckedChange={() => toggleFilter('clientName', String(value))}
                                />
                                <label
                                  htmlFor={`clientName-${value}`}
                                  className="text-sm cursor-pointer"
                                >
                                  {String(value)}
                                </label>
                              </div>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </th>

                  {/* Escalated By */}
                  <th className="sticky top-0 bg-background backdrop-blur-sm p-3 text-center font-semibold border-b">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        className="flex items-center text-primary hover:text-primary/80 transition-colors"
                        onClick={() => handleSort('escalatedBy')}
                      >
                        Escalated By
                        {getSortIcon('escalatedBy')}
                      </button>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="p-1 hover:bg-muted rounded">
                            <Filter className={`h-3.5 w-3.5 ${filters.escalatedBy?.length > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48" align="center">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Filter Contact</span>
                              {filters.escalatedBy?.length > 0 && (
                                <button
                                  className="text-xs text-muted-foreground hover:text-foreground"
                                  onClick={() => clearFilter('escalatedBy')}
                                >
                                  Clear
                                </button>
                              )}
                            </div>
                            {getUniqueValues('escalatedBy').map((value) => (
                              <div key={String(value)} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`escalatedBy-${value}`}
                                  checked={filters.escalatedBy?.includes(String(value))}
                                  onCheckedChange={() => toggleFilter('escalatedBy', String(value))}
                                />
                                <label
                                  htmlFor={`escalatedBy-${value}`}
                                  className="text-sm cursor-pointer"
                                >
                                  {String(value)}
                                </label>
                              </div>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </th>

                  {/* Assigned To */}
                  <th className="sticky top-0 bg-background backdrop-blur-sm p-3 text-center font-semibold border-b">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        className="flex items-center text-primary hover:text-primary/80 transition-colors"
                        onClick={() => handleSort('assignedTo')}
                      >
                        Assigned To
                        {getSortIcon('assignedTo')}
                      </button>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="p-1 hover:bg-muted rounded">
                            <Filter className={`h-3.5 w-3.5 ${filters.assignedTo?.length > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48" align="center">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Filter Assigned</span>
                              {filters.assignedTo?.length > 0 && (
                                <button
                                  className="text-xs text-muted-foreground hover:text-foreground"
                                  onClick={() => clearFilter('assignedTo')}
                                >
                                  Clear
                                </button>
                              )}
                            </div>
                            {getUniqueValues('assignedTo').map((value) => (
                              <div key={String(value)} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`assignedTo-${value}`}
                                  checked={filters.assignedTo?.includes(String(value))}
                                  onCheckedChange={() => toggleFilter('assignedTo', String(value))}
                                />
                                <label
                                  htmlFor={`assignedTo-${value}`}
                                  className="text-sm cursor-pointer"
                                >
                                  {String(value)}
                                </label>
                              </div>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </th>

                  {/* Last Interaction Date */}
                  <th className="sticky top-0 bg-background backdrop-blur-sm p-3 text-center font-semibold border-b">
                    <button
                      className="flex items-center justify-center w-full text-primary hover:text-primary/80 transition-colors"
                      onClick={() => handleSort('lastInteractionDate')}
                    >
                      Last Interaction
                      {getSortIcon('lastInteractionDate')}
                    </button>
                  </th>

                  {/* Case Status */}
                  <th className="sticky top-0 bg-background backdrop-blur-sm p-3 text-center font-semibold border-b">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        className="flex items-center text-primary hover:text-primary/80 transition-colors"
                        onClick={() => handleSort('status')}
                      >
                        Status
                        {getSortIcon('status')}
                      </button>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="p-1 hover:bg-muted rounded">
                            <Filter className={`h-3.5 w-3.5 ${filters.status?.length > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48" align="center">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Filter Status</span>
                              {filters.status?.length > 0 && (
                                <button
                                  className="text-xs text-muted-foreground hover:text-foreground"
                                  onClick={() => clearFilter('status')}
                                >
                                  Clear
                                </button>
                              )}
                            </div>
                            {getUniqueValues('status').map((status) => (
                              <div key={String(status)} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`status-${status}`}
                                  checked={filters.status?.includes(String(status))}
                                  onCheckedChange={() => toggleFilter('status', String(status))}
                                />
                                <label
                                  htmlFor={`status-${status}`}
                                  className="text-sm cursor-pointer"
                                >
                                  {String(status)}
                                </label>
                              </div>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </th>

                  {/* Action Required By */}
                  <th className="sticky top-0 bg-background backdrop-blur-sm p-3 text-center font-semibold border-b">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        className="flex items-center text-primary hover:text-primary/80 transition-colors"
                        onClick={() => handleSort('actionRequired')}
                      >
                        Action Required
                        {getSortIcon('actionRequired')}
                      </button>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="p-1 hover:bg-muted rounded">
                            <Filter className={`h-3.5 w-3.5 ${filters.actionRequired?.length > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48" align="center">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Filter By</span>
                              {filters.actionRequired?.length > 0 && (
                                <button
                                  className="text-xs text-muted-foreground hover:text-foreground"
                                  onClick={() => clearFilter('actionRequired')}
                                >
                                  Clear
                                </button>
                              )}
                            </div>
                            {getUniqueValues('actionRequired').map((value) => (
                              <div key={String(value)} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`actionRequired-${value}`}
                                  checked={filters.actionRequired?.includes(String(value))}
                                  onCheckedChange={() => toggleFilter('actionRequired', String(value))}
                                />
                                <label
                                  htmlFor={`actionRequired-${value}`}
                                  className="text-sm cursor-pointer"
                                >
                                  {String(value)}
                                </label>
                              </div>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedCases.map((caseItem) => (
                  <tr
                    key={caseItem.id}
                    className={`border-b cursor-pointer hover:bg-muted/30 ${
                      selectedCase?.id === caseItem.id ? 'bg-muted' : ''
                    }`}
                    onClick={() => handleCaseClick(caseItem)}
                  >
                    {/* Case ID */}
                    <td className="p-3 font-medium">
                      {caseItem.caseId}
                    </td>

                    {/* Case Title */}
                    <td className="p-3 max-w-[300px] truncate">
                      {caseItem.title}
                    </td>

                    {/* Client */}
                    <td className="p-3 text-center">
                      <Link
                        href={`/admin/clients/${caseItem.clientId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm hover:underline"
                      >
                        {caseItem.clientName}
                      </Link>
                    </td>

                    {/* Escalated By */}
                    <td className="p-3 text-center">
                      {caseItem.escalatedBy}
                    </td>

                    {/* Assigned To */}
                    <td className="p-3 text-center">
                      {caseItem.assignedTo || '-'}
                    </td>

                    {/* Last Interaction Date */}
                    <td className="p-3 text-center text-muted-foreground">
                      {caseItem.lastInteractionDate}
                    </td>

                    {/* Case Status */}
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className={`h-2.5 w-2.5 rounded-full ${getStatusDotColor(caseItem.status)}`} />
                        <span className="text-sm">{caseItem.status}</span>
                      </div>
                    </td>

                    {/* Action Required By */}
                    <td className="p-3 text-center">
                      <div className="flex justify-center">
                        <span className={`inline-flex items-center justify-center px-3 py-1 rounded text-sm font-medium w-[110px] ${getActionRequiredColor(caseItem.actionRequired)}`}>
                          {caseItem.actionRequired || '-'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
        )}
      </Card>

      {/* Case Details and Interactions - Only show when a case is selected */}
      {selectedCase && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          {/* Left: Case Details Widget */}
          <CaseDetailsWidget
            caseData={{
              id: selectedCase.id,
              caseId: selectedCase.caseId,
              title: selectedCase.title,
              creationDate: selectedCase.creationDate,
              status: selectedCase.status,
              actionRequiredBy: selectedCase.actionRequiredBy,
              actionRequired: selectedCase.actionRequired,
              escalatedBy: selectedCase.escalatedBy,
              assignedTo: selectedCase.assignedTo,
              description: selectedCase.description || null,
            }}
            clientId={selectedCase.clientId}
          />

          {/* Right: Case Interactions Widget */}
          <CaseInteractionsWidget
            caseId={selectedCase.caseId}
            caseNumericId={selectedCase.id}
            clientId={selectedCase.clientId}
          />
        </div>
      )}
    </>
  );
}
