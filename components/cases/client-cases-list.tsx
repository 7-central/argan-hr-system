'use client';

import { useState, useMemo } from 'react';

import { ArrowUpDown, ArrowUp, ArrowDown, Filter, Plus } from 'lucide-react';

import { CaseDetailsWidget } from '@/components/cases/case-details-widget';
import { CaseInteractionsWidget } from '@/components/cases/case-interactions-widget';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface ClientCasesListProps {
  clientId: number;
  clientName: string;
  cases: never[]; // TODO: Replace with proper Case type
  searchTerm?: string;
}

// Placeholder data - 20 cases
const PLACEHOLDER_CASES = Array.from({ length: 20 }, (_, i) => {
  const status = ['OPEN', 'CLOSED', 'AWAITING'][i % 3] as 'OPEN' | 'CLOSED' | 'AWAITING';

  return {
    id: i + 1,
    caseId: `CASE-${String(i + 1).padStart(4, '0')}`,
    title: [
      'Disciplinary Action Review',
      'Contract Termination Query',
      'Sick Leave Extension Request',
      'Performance Improvement Plan',
      'Holiday Entitlement Dispute',
      'Workplace Grievance Investigation',
      'Redundancy Consultation',
      'Maternity Leave Planning',
      'Flexible Working Request',
      'Salary Review Discussion',
      'Training Budget Approval',
      'Remote Work Policy Query',
      'Staff Wellbeing Initiative',
      'Overtime Payment Issue',
      'Promotion Eligibility Review',
      'Exit Interview Follow-up',
      'Probation Period Extension',
      'Employee Relations Matter',
      'Health & Safety Concern',
      'Data Protection Compliance',
    ][i % 20],
    creationDate: new Date(2024, 0, 1 + i * 3).toLocaleDateString('en-GB'),
    status,
    // Set action required to null if case is closed
    actionRequired: status === 'CLOSED' ? null : (['ARGAN', 'CLIENT', 'CONTRACTOR', 'EMPLOYEE'][i % 4] as 'ARGAN' | 'CLIENT' | 'CONTRACTOR' | 'EMPLOYEE'),
    escalatedBy: [
      'Sarah Johnson',
      'Michael Chen',
      'Emma Williams',
      'David Smith',
      'Lisa Anderson',
    ][i % 5],
    // Some cases might not be assigned yet
    assignedTo: i % 7 === 0 ? null : [
      'Kim Fletcher',
      'Ric Thompson',
      'Sue Davies',
    ][i % 3],
  };
});

/**
 * Client Cases List Component
 * Displays list of cases with action buttons
 */
export function ClientCasesList({ clientId, clientName, cases, searchTerm = '' }: ClientCasesListProps) {
  const [selectedCase, setSelectedCase] = useState<typeof PLACEHOLDER_CASES[0] | null>(null);
  const [sortColumn, setSortColumn] = useState<'caseId' | 'title' | 'escalatedBy' | 'assignedTo' | 'creationDate' | 'status' | 'actionRequired'>('creationDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Filters state - stores selected values for each column
  const [filters, setFilters] = useState<Record<string, string[]>>({
    status: [],
    actionRequired: [],
    assignedTo: [],
    escalatedBy: [],
  });

  // New case modal state
  const [isNewCaseDialogOpen, setIsNewCaseDialogOpen] = useState(false);
  const [newCaseTitle, setNewCaseTitle] = useState('');
  const [newCaseEscalatedBy, setNewCaseEscalatedBy] = useState('');
  const [newCaseAssignedTo, setNewCaseAssignedTo] = useState<string | null>(null);
  const [newCaseStatus, setNewCaseStatus] = useState<'OPEN' | 'AWAITING' | 'CLOSED'>('OPEN');
  const [newCaseActionRequired, setNewCaseActionRequired] = useState<'ARGAN' | 'CLIENT' | 'CONTRACTOR' | 'EMPLOYEE'>('ARGAN');
  const [newCaseDescription, setNewCaseDescription] = useState('');

  /**
   * Handle case click
   */
  const handleCaseClick = (caseItem: typeof PLACEHOLDER_CASES[0]) => {
    console.log('Case clicked:', caseItem.caseId);
    setSelectedCase(caseItem);
    // TODO: Show case details below or in expanded section
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
   * Handle action required change
   */
  const handleActionRequiredChange = (caseId: string, newValue: string | null) => {
    console.log(`Changing action required for ${caseId} to ${newValue || '-'}`);
    // TODO: Update via API
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
  const getUniqueValues = (column: keyof typeof PLACEHOLDER_CASES[0]) => {
    return [...new Set(PLACEHOLDER_CASES.map(c => c[column]))].sort();
  };

  /**
   * Apply filters and sort cases
   */
  const filteredAndSortedCases = useMemo(() => {
    // First filter
    let filtered = PLACEHOLDER_CASES.filter(caseItem => {
      // Apply search term filter
      if (searchTerm.trim()) {
        const search = searchTerm.toLowerCase();
        const matchesSearch =
          caseItem.caseId.toLowerCase().includes(search) ||
          caseItem.title.toLowerCase().includes(search) ||
          caseItem.escalatedBy.toLowerCase().includes(search) ||
          (caseItem.assignedTo?.toLowerCase() || '').includes(search);

        if (!matchesSearch) {
          return false;
        }
      }

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
  }, [searchTerm, filters, sortColumn, sortDirection]);

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

  /**
   * Handle assigned to change
   */
  const handleAssignedToChange = (caseId: string, newValue: string | null) => {
    console.log(`Changing assigned to for ${caseId} to ${newValue || '-'}`);
    // TODO: Update via API
  };

  /**
   * Handle case status change
   */
  const handleCaseStatusChange = (caseId: string, newValue: string) => {
    console.log(`Changing case status for ${caseId} to ${newValue}`);
    // TODO: Update via API
  };

  /**
   * Handle create new case
   */
  const handleCreateNewCase = () => {
    if (!newCaseTitle.trim() || !newCaseEscalatedBy.trim()) {
      return;
    }

    console.log('Creating new case:', {
      title: newCaseTitle,
      escalatedBy: newCaseEscalatedBy,
      assignedTo: newCaseAssignedTo,
      status: newCaseStatus,
      actionRequired: newCaseActionRequired,
      description: newCaseDescription,
    });

    // TODO: Call API to create case

    // Reset form
    setNewCaseTitle('');
    setNewCaseEscalatedBy('');
    setNewCaseAssignedTo(null);
    setNewCaseStatus('OPEN');
    setNewCaseActionRequired('ARGAN');
    setNewCaseDescription('');
    setIsNewCaseDialogOpen(false);
  };

  return (
    <>
      {/* Full Width Widget - Cases List */}
      <Card className="w-full border-0 shadow-none">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 px-0">
          <CardTitle>Cases</CardTitle>
          <Button
            size="sm"
            onClick={() => setIsNewCaseDialogOpen(true)}
            className="h-9"
          >
            <Plus className="mr-2 h-4 w-4" />
            Open New Case
          </Button>
        </CardHeader>
        <CardContent className="pt-0 px-0">
          <div className="max-h-[250px] overflow-y-auto relative">
            <table className="w-full caption-bottom text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap sticky top-0 z-10 bg-background shadow-[0_1px_0_0_hsl(var(--border))]">
                    <button
                      className="flex items-center text-primary text-base font-semibold hover:text-primary/80 transition-colors"
                      onClick={() => handleSort('caseId')}
                    >
                      Case ID
                      {getSortIcon('caseId')}
                    </button>
                  </th>
                  <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap sticky top-0 z-10 bg-background shadow-[0_1px_0_0_hsl(var(--border))]">
                    <button
                      className="flex items-center text-primary text-base font-semibold hover:text-primary/80 transition-colors"
                      onClick={() => handleSort('title')}
                    >
                      Case Title
                      {getSortIcon('title')}
                    </button>
                  </th>
                  <th className="text-foreground h-10 px-2 text-center align-middle font-medium whitespace-nowrap sticky top-0 z-10 bg-background shadow-[0_1px_0_0_hsl(var(--border))]">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        className="flex items-center text-primary text-base font-semibold hover:text-primary/80 transition-colors"
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
                              <div key={value} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`escalatedBy-${value}`}
                                  checked={filters.escalatedBy?.includes(String(value))}
                                  onCheckedChange={() => toggleFilter('escalatedBy', String(value))}
                                />
                                <label
                                  htmlFor={`escalatedBy-${value}`}
                                  className="text-sm cursor-pointer"
                                >
                                  {value}
                                </label>
                              </div>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </th>
                  <th className="text-foreground h-10 px-2 text-center align-middle font-medium whitespace-nowrap sticky top-0 z-10 bg-background shadow-[0_1px_0_0_hsl(var(--border))]">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        className="flex items-center text-primary text-base font-semibold hover:text-primary/80 transition-colors"
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
                              <div key={value} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`assignedTo-${value}`}
                                  checked={filters.assignedTo?.includes(String(value))}
                                  onCheckedChange={() => toggleFilter('assignedTo', String(value))}
                                />
                                <label
                                  htmlFor={`assignedTo-${value}`}
                                  className="text-sm cursor-pointer"
                                >
                                  {value}
                                </label>
                              </div>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </th>
                  <th className="text-foreground h-10 px-2 text-center align-middle font-medium whitespace-nowrap sticky top-0 z-10 bg-background shadow-[0_1px_0_0_hsl(var(--border))]">
                    <button
                      className="flex items-center justify-center w-full text-primary text-base font-semibold hover:text-primary/80 transition-colors"
                      onClick={() => handleSort('creationDate')}
                    >
                      Creation Date
                      {getSortIcon('creationDate')}
                    </button>
                  </th>
                  <th className="text-foreground h-10 px-2 text-center align-middle font-medium whitespace-nowrap sticky top-0 z-10 bg-background shadow-[0_1px_0_0_hsl(var(--border))]">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        className="flex items-center text-primary text-base font-semibold hover:text-primary/80 transition-colors"
                        onClick={() => handleSort('status')}
                      >
                        Case Status
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
                              <div key={status} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`status-${status}`}
                                  checked={filters.status?.includes(String(status))}
                                  onCheckedChange={() => toggleFilter('status', String(status))}
                                />
                                <label
                                  htmlFor={`status-${status}`}
                                  className="text-sm cursor-pointer"
                                >
                                  {status}
                                </label>
                              </div>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </th>
                  <th className="text-foreground h-10 px-2 text-center align-middle font-medium whitespace-nowrap sticky top-0 z-10 bg-background shadow-[0_1px_0_0_hsl(var(--border))]">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        className="flex items-center text-primary text-base font-semibold hover:text-primary/80 transition-colors"
                        onClick={() => handleSort('actionRequired')}
                      >
                        Action Required By
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
                              <div key={value} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`actionRequired-${value}`}
                                  checked={filters.actionRequired?.includes(String(value))}
                                  onCheckedChange={() => toggleFilter('actionRequired', String(value))}
                                />
                                <label
                                  htmlFor={`actionRequired-${value}`}
                                  className="text-sm cursor-pointer"
                                >
                                  {value}
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
                    className={`border-b cursor-pointer hover:bg-muted/50 transition-all duration-200 ${
                      selectedCase?.id === caseItem.id ? 'bg-muted' : ''
                    }`}
                    onClick={() => handleCaseClick(caseItem)}
                  >
                    {/* Case ID */}
                    <td className="p-2 align-middle whitespace-nowrap font-medium text-left">
                      {caseItem.caseId}
                    </td>

                    {/* Case Title */}
                    <td className="p-2 align-middle whitespace-nowrap text-left">
                      {caseItem.title}
                    </td>

                    {/* Escalated By */}
                    <td className="p-2 align-middle whitespace-nowrap text-center text-sm">
                      {caseItem.escalatedBy}
                    </td>

                    {/* Assigned To */}
                    <td className="p-2 align-middle whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="text-sm font-medium hover:underline cursor-pointer">
                            {caseItem.assignedTo || '-'}
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="center">
                          <DropdownMenuItem onClick={() => handleAssignedToChange(caseItem.caseId, null)} className="justify-center">
                            <span className="text-sm text-muted-foreground">-</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAssignedToChange(caseItem.caseId, 'Kim Fletcher')}>
                            <span className="text-sm">Kim Fletcher</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAssignedToChange(caseItem.caseId, 'Ric Thompson')}>
                            <span className="text-sm">Ric Thompson</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAssignedToChange(caseItem.caseId, 'Sue Davies')}>
                            <span className="text-sm">Sue Davies</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>

                    {/* Creation Date */}
                    <td className="text-center text-sm text-muted-foreground">
                      {caseItem.creationDate}
                    </td>

                    {/* Case Status */}
                    <td className="p-2 align-middle whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        <div className={`h-2.5 w-2.5 rounded-full ${getStatusDotColor(caseItem.status)}`} />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="text-sm hover:underline cursor-pointer">
                              {caseItem.status}
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="center">
                            <DropdownMenuItem onClick={() => handleCaseStatusChange(caseItem.caseId, 'OPEN')}>
                              <span className="text-sm">OPEN</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCaseStatusChange(caseItem.caseId, 'AWAITING')}>
                              <span className="text-sm">AWAITING</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCaseStatusChange(caseItem.caseId, 'CLOSED')}>
                              <span className="text-sm">CLOSED</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>

                    {/* Action Required By */}
                    <td className="p-2 align-middle whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className={`inline-flex items-center justify-center px-3 py-1 rounded text-sm font-medium cursor-pointer transition-colors w-[110px] ${getActionRequiredColor(caseItem.actionRequired)}`}>
                              {caseItem.actionRequired || '-'}
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="center">
                            <DropdownMenuItem onClick={() => handleActionRequiredChange(caseItem.caseId, null)} className="justify-center">
                              <span className="text-sm text-muted-foreground">-</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleActionRequiredChange(caseItem.caseId, 'ARGAN')}>
                              <span className="text-sm">ARGAN</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleActionRequiredChange(caseItem.caseId, 'CLIENT')}>
                              <span className="text-sm">CLIENT</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleActionRequiredChange(caseItem.caseId, 'CONTRACTOR')}>
                              <span className="text-sm">CONTRACTOR</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleActionRequiredChange(caseItem.caseId, 'EMPLOYEE')}>
                              <span className="text-sm">EMPLOYEE</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Case Details and Interactions - Only show when a case is selected */}
      {selectedCase && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Left: Case Details Widget */}
          <CaseDetailsWidget
            caseData={{
              caseId: selectedCase.caseId,
              title: selectedCase.title,
              creationDate: selectedCase.creationDate,
              status: selectedCase.status,
              actionRequired: selectedCase.actionRequired,
              escalatedBy: selectedCase.escalatedBy,
              assignedTo: selectedCase.assignedTo,
            }}
          />

          {/* Right: Case Interactions Widget */}
          <CaseInteractionsWidget caseId={selectedCase.caseId} />
        </div>
      )}

      {/* Open New Case Dialog */}
      <Dialog open={isNewCaseDialogOpen} onOpenChange={setIsNewCaseDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Open New Case</DialogTitle>
            <DialogDescription>
              Create a new case for {clientName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Case Title */}
            <div className="space-y-2">
              <Label htmlFor="case-title">Case Title</Label>
              <Input
                id="case-title"
                placeholder="Enter case title..."
                value={newCaseTitle}
                onChange={(e) => setNewCaseTitle(e.target.value)}
              />
            </div>

            {/* Escalated By */}
            <div className="space-y-2">
              <Label htmlFor="escalated-by">Escalated By</Label>
              <Input
                id="escalated-by"
                placeholder="Enter contact name..."
                value={newCaseEscalatedBy}
                onChange={(e) => setNewCaseEscalatedBy(e.target.value)}
              />
            </div>

            {/* Assigned To and Action Required By - Side by side */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assigned-to">Assigned To</Label>
                <Select value={newCaseAssignedTo || 'none'} onValueChange={(value) => setNewCaseAssignedTo(value === 'none' ? null : value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select team member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-</SelectItem>
                    <SelectItem value="Kim Fletcher">Kim Fletcher</SelectItem>
                    <SelectItem value="Ric Thompson">Ric Thompson</SelectItem>
                    <SelectItem value="Sue Davies">Sue Davies</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="action-required">Action Required By</Label>
                <Select value={newCaseActionRequired} onValueChange={(value: any) => setNewCaseActionRequired(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select who needs to act" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ARGAN">Argan</SelectItem>
                    <SelectItem value="CLIENT">Client</SelectItem>
                    <SelectItem value="CONTRACTOR">Contractor</SelectItem>
                    <SelectItem value="EMPLOYEE">Employee</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Case Status */}
            <div className="space-y-2">
              <Label htmlFor="case-status">Case Status</Label>
              <Select value={newCaseStatus} onValueChange={(value: any) => setNewCaseStatus(value)}>
                <SelectTrigger className="w-[calc(50%-0.5rem)]">
                  <SelectValue placeholder="Select case status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="AWAITING">Awaiting</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Case Description */}
            <div className="space-y-2">
              <Label htmlFor="case-description">Case Description</Label>
              <Textarea
                id="case-description"
                placeholder="Enter detailed information about this case..."
                className="min-h-[200px] resize-none"
                value={newCaseDescription}
                onChange={(e) => setNewCaseDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewCaseDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateNewCase}
              disabled={!newCaseTitle.trim() || !newCaseEscalatedBy.trim()}
            >
              Create Case
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
