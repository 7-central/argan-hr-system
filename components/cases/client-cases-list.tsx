'use client';

import { useState, useMemo, useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { ArrowUpDown, ArrowUp, ArrowDown, Filter, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { CaseDetailsWidget } from '@/components/cases/case-details-widget';
import { CaseInteractionsWidget } from '@/components/cases/case-interactions-widget';
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

import { createCase, updateCase, getAdminUsers } from '@/app/admin/(protected)/clients/[id]/cases/actions';

import type { CaseData } from '@/components/cases/cases-page-content';


interface ClientCasesListProps {
  clientId: number;
  clientName: string;
  cases: CaseData[];
  searchTerm?: string;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
}

/**
 * Client Cases List Component
 * Displays list of cases with action buttons
 */
export function ClientCasesList({ clientId, clientName, cases, searchTerm = '' }: ClientCasesListProps) {
  const router = useRouter();
  const [selectedCase, setSelectedCase] = useState<CaseData | null>(null);
  const [sortColumn, setSortColumn] = useState<'caseId' | 'title' | 'escalatedBy' | 'assignedTo' | 'creationDate' | 'status' | 'actionRequired'>('creationDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Filters state - stores selected values for each column
  const [filters, setFilters] = useState<Record<string, string[]>>({
    status: [],
    actionRequired: [],
    assignedTo: [],
    escalatedBy: [],
  });

  // Admin users state
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);

  // New case modal state
  const [isNewCaseDialogOpen, setIsNewCaseDialogOpen] = useState(false);
  const [newCaseTitle, setNewCaseTitle] = useState('');
  const [newCaseEscalatedBy, setNewCaseEscalatedBy] = useState('');
  const [newCaseAssignedTo, setNewCaseAssignedTo] = useState<string | null>(null);
  const [newCaseStatus, setNewCaseStatus] = useState<'OPEN' | 'AWAITING' | 'CLOSED'>('OPEN');
  const [newCaseActionRequired, setNewCaseActionRequired] = useState<'ARGAN' | 'CLIENT' | 'CONTRACTOR' | 'EMPLOYEE'>('ARGAN');
  const [newCaseDescription, setNewCaseDescription] = useState('');

  /**
   * Load admin users on mount
   */
  useEffect(() => {
    const loadAdminUsers = async () => {
      const result = await getAdminUsers();
      if (result.success && result.data) {
        setAdminUsers(result.data);
      } else {
        toast.error(result.error || 'Failed to load admin users');
      }
    };

    loadAdminUsers();
  }, []);

  /**
   * Handle case click
   */
  const handleCaseClick = (caseItem: CaseData) => {
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
   * Handle action required change
   */
  const handleActionRequiredChange = async (id: number, caseId: string, newValue: string | null) => {
    const result = await updateCase(id, { actionRequiredBy: newValue as 'ARGAN' | 'CLIENT' | 'CONTRACTOR' | 'EMPLOYEE' | null });

    if (result.success) {
      toast.success(`Action required changed to ${newValue || '-'}`);
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to update case');
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
  const getUniqueValues = (column: keyof CaseData) => {
    return [...new Set(cases.map(c => c[column]))].filter(Boolean).sort();
  };

  /**
   * Apply filters and sort cases
   */
  const filteredAndSortedCases = useMemo(() => {
    // First filter
    const filtered = cases.filter(caseItem => {
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
  }, [cases, searchTerm, filters, sortColumn, sortDirection]);

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
  const handleAssignedToChange = async (id: number, caseId: string, newValue: string | null) => {
    const result = await updateCase(id, { assignedTo: newValue });

    if (result.success) {
      toast.success(`Assigned to ${newValue || '-'}`);
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to update case');
    }
  };

  /**
   * Handle case status change
   */
  const handleCaseStatusChange = async (id: number, caseId: string, newValue: string) => {
    const result = await updateCase(id, { status: newValue as 'OPEN' | 'AWAITING' | 'CLOSED' });

    if (result.success) {
      toast.success(`Status changed to ${newValue}`);
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to update case');
    }
  };

  /**
   * Handle create new case
   */
  const handleCreateNewCase = async () => {
    if (!newCaseTitle.trim() || !newCaseEscalatedBy.trim()) {
      return;
    }

    const result = await createCase({
      clientId,
      title: newCaseTitle,
      escalatedBy: newCaseEscalatedBy,
      assignedTo: newCaseAssignedTo,
      status: newCaseStatus,
      actionRequiredBy: newCaseActionRequired,
      description: newCaseDescription,
    });

    if (result.success) {
      toast.success('New case has been created successfully');

      // Reset form
      setNewCaseTitle('');
      setNewCaseEscalatedBy('');
      setNewCaseAssignedTo(null);
      setNewCaseStatus('OPEN');
      setNewCaseActionRequired('ARGAN');
      setNewCaseDescription('');
      setIsNewCaseDialogOpen(false);

      router.refresh();
    } else {
      toast.error(result.error || 'Failed to create case');
    }
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
                          <DropdownMenuItem onClick={() => handleAssignedToChange(caseItem.id, caseItem.caseId, null)} className="justify-center">
                            <span className="text-sm text-muted-foreground">-</span>
                          </DropdownMenuItem>
                          {adminUsers.map((admin) => (
                            <DropdownMenuItem key={admin.id} onClick={() => handleAssignedToChange(caseItem.id, caseItem.caseId, admin.name)}>
                              <span className="text-sm">{admin.name}</span>
                            </DropdownMenuItem>
                          ))}
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
                            <DropdownMenuItem onClick={() => handleCaseStatusChange(caseItem.id, caseItem.caseId, 'OPEN')}>
                              <span className="text-sm">OPEN</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCaseStatusChange(caseItem.id, caseItem.caseId, 'AWAITING')}>
                              <span className="text-sm">AWAITING</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCaseStatusChange(caseItem.id, caseItem.caseId, 'CLOSED')}>
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
                            <DropdownMenuItem onClick={() => handleActionRequiredChange(caseItem.id, caseItem.caseId, null)} className="justify-center">
                              <span className="text-sm text-muted-foreground">-</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleActionRequiredChange(caseItem.id, caseItem.caseId, 'ARGAN')}>
                              <span className="text-sm">ARGAN</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleActionRequiredChange(caseItem.id, caseItem.caseId, 'CLIENT')}>
                              <span className="text-sm">CLIENT</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleActionRequiredChange(caseItem.id, caseItem.caseId, 'CONTRACTOR')}>
                              <span className="text-sm">CONTRACTOR</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleActionRequiredChange(caseItem.id, caseItem.caseId, 'EMPLOYEE')}>
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
              description: selectedCase.description || null,
            }}
            clientId={clientId}
          />

          {/* Right: Case Interactions Widget */}
          <CaseInteractionsWidget
            caseId={selectedCase.caseId}
            caseNumericId={selectedCase.id}
            clientId={clientId}
          />
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
                    {adminUsers.map((admin) => (
                      <SelectItem key={admin.id} value={admin.name}>
                        {admin.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="action-required">Action Required By</Label>
                <Select value={newCaseActionRequired} onValueChange={(value) => setNewCaseActionRequired(value as 'ARGAN' | 'CLIENT' | 'CONTRACTOR' | 'EMPLOYEE')}>
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
              <Select value={newCaseStatus} onValueChange={(value) => setNewCaseStatus(value as 'OPEN' | 'AWAITING' | 'CLOSED')}>
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
