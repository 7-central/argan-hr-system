'use client';

import { useState, useMemo } from 'react';

import { Search, ChevronDown, ChevronUp } from 'lucide-react';

import { CallLogList } from '@/components/cases/call-log-list';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface CallLogCaseData {
  id: number;
  caseId: string;
  title: string;
  clientId: number;
  clientName: string;
  clientTier: 'TIER_1' | 'TIER_2' | 'TIER_3' | 'AD_HOC' | 'DOC_ONLY';
  creationDate: string;
  lastInteractionDate: string;
  lastInteractionDateTime: Date;
  status: 'OPEN' | 'AWAITING' | 'CLOSED';
  actionRequiredBy: 'ARGAN' | 'CLIENT' | 'CONTRACTOR' | 'EMPLOYEE' | null;
  actionRequired: string | null;
  escalatedBy: string;
  assignedTo: string | null;
  description?: string | null;
  interactionCount?: number;
  fileCount?: number;
}

type ServiceTierFilter = 'ALL' | 'TIER_1' | 'DOC_ONLY' | 'AD_HOC';

interface ServiceTierToggleProps {
  value: ServiceTierFilter;
  onChange: (value: ServiceTierFilter) => void;
}

/**
 * Service Tier Toggle Component
 * Pill-style toggle for filtering by service tier
 */
function ServiceTierToggle({ value, onChange }: ServiceTierToggleProps) {
  const options: { value: ServiceTierFilter; label: string }[] = [
    { value: 'ALL', label: 'All' },
    { value: 'TIER_1', label: 'Tier 1' },
    { value: 'DOC_ONLY', label: 'Doc Only' },
    { value: 'AD_HOC', label: 'Ad Hoc' },
  ];

  return (
    <div className="inline-flex items-center gap-1 p-1 bg-muted/50 rounded-full border">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
            value === option.value
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

type ActionRequiredFilter = 'ALL' | 'ARGAN' | 'CLIENT' | 'CONTRACTOR' | 'EMPLOYEE';

interface ActionRequiredToggleProps {
  value: ActionRequiredFilter;
  onChange: (value: ActionRequiredFilter) => void;
}

/**
 * Action Required Toggle Component
 * Pill-style toggle for filtering by action required party
 */
function ActionRequiredToggle({ value, onChange }: ActionRequiredToggleProps) {
  const options: { value: ActionRequiredFilter; label: string }[] = [
    { value: 'ALL', label: 'All' },
    { value: 'ARGAN', label: 'Argan' },
    { value: 'CLIENT', label: 'Client' },
    { value: 'CONTRACTOR', label: 'Contractor' },
    { value: 'EMPLOYEE', label: 'Employee' },
  ];

  return (
    <div className="inline-flex items-center gap-1 p-1 bg-muted/50 rounded-full border">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
            value === option.value
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

interface CallLogContentProps {
  cases: CallLogCaseData[];
}

/**
 * Call Log Content Component
 * Manages the display and interaction of all cases across all clients
 * Features toggle filters for time-based and action-based filtering
 */
export function CallLogContent({ cases }: CallLogContentProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Service Tier filter states (independent for each widget)
  const [openCallsTierFilter, setOpenCallsTierFilter] = useState<ServiceTierFilter>('ALL');
  const [awaitingCallsTierFilter, setAwaitingCallsTierFilter] = useState<ServiceTierFilter>('ALL');

  // Action Required filter states (independent for each widget)
  const [openCallsActionFilter, setOpenCallsActionFilter] = useState<ActionRequiredFilter>('ALL');
  const [awaitingCallsActionFilter, setAwaitingCallsActionFilter] = useState<ActionRequiredFilter>('ALL');

  // Assigned To filter states (independent for each widget)
  const [openCallsAssignedToFilter, setOpenCallsAssignedToFilter] = useState<string>('ALL');
  const [awaitingCallsAssignedToFilter, setAwaitingCallsAssignedToFilter] = useState<string>('ALL');

  // Client filter states (independent for each widget)
  const [openCallsClientFilter, setOpenCallsClientFilter] = useState<string>('ALL');
  const [awaitingCallsClientFilter, setAwaitingCallsClientFilter] = useState<string>('ALL');

  // Filter section expanded states (default: collapsed)
  const [openCallsFiltersExpanded, setOpenCallsFiltersExpanded] = useState(false);
  const [awaitingCallsFiltersExpanded, setAwaitingCallsFiltersExpanded] = useState(false);

  // Get unique assignedTo values from all cases
  const uniqueAssignedToOptions = useMemo(() => {
    const assignedToSet = new Set<string>();
    cases.forEach(caseItem => {
      if (caseItem.assignedTo) {
        assignedToSet.add(caseItem.assignedTo);
      }
    });
    return Array.from(assignedToSet).sort();
  }, [cases]);

  // Get unique clients from all cases
  const uniqueClientOptions = useMemo(() => {
    const clientMap = new Map<number, string>();
    cases.forEach(caseItem => {
      clientMap.set(caseItem.clientId, caseItem.clientName);
    });
    return Array.from(clientMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [cases]);

  /**
   * Apply filters to cases
   */
  const filteredCases = useMemo(() => {
    let filtered = [...cases];

    // Search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(caseItem =>
        caseItem.caseId.toLowerCase().includes(search) ||
        caseItem.title.toLowerCase().includes(search) ||
        caseItem.clientName.toLowerCase().includes(search) ||
        caseItem.escalatedBy.toLowerCase().includes(search) ||
        (caseItem.assignedTo?.toLowerCase() || '').includes(search)
      );
    }

    return filtered;
  }, [cases, searchTerm]);

  /**
   * Apply service tier filter to widget cases
   */
  const filterByServiceTier = (casesToFilter: CallLogCaseData[], tierFilter: ServiceTierFilter) => {
    if (tierFilter === 'ALL') {
      return casesToFilter;
    }
    return casesToFilter.filter(caseItem => caseItem.clientTier === tierFilter);
  };

  /**
   * Apply action required filter to widget cases
   */
  const filterByActionRequired = (casesToFilter: CallLogCaseData[], actionFilter: ActionRequiredFilter) => {
    if (actionFilter === 'ALL') {
      return casesToFilter;
    }
    return casesToFilter.filter(caseItem => caseItem.actionRequired === actionFilter);
  };

  /**
   * Apply assigned to filter to widget cases
   */
  const filterByAssignedTo = (casesToFilter: CallLogCaseData[], assignedToFilter: string) => {
    if (assignedToFilter === 'ALL') {
      return casesToFilter;
    }
    return casesToFilter.filter(caseItem => caseItem.assignedTo === assignedToFilter);
  };

  /**
   * Apply client filter to widget cases
   */
  const filterByClient = (casesToFilter: CallLogCaseData[], clientFilter: string) => {
    if (clientFilter === 'ALL') {
      return casesToFilter;
    }
    // clientFilter is stored as string of clientId
    return casesToFilter.filter(caseItem => caseItem.clientId.toString() === clientFilter);
  };

  return (
    <div className="w-full">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search cases by ID, title, client, or contact..."
          className="pl-8 md:w-[400px] lg:w-[500px]"
        />
      </div>

      {/* Toggle Filters - COMMENTED OUT FOR NOW */}
      {/* <div className="flex flex-wrap gap-6 items-center p-4 bg-muted/30 rounded-lg border">
        <div className="flex items-center gap-3">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium">Time:</Label>
          <div className="flex gap-2">
            <button
              onClick={() => setTimeFilter('all')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                timeFilter === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:bg-muted'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setTimeFilter('today')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                timeFilter === 'today'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:bg-muted'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setTimeFilter('week')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                timeFilter === 'week'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:bg-muted'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setTimeFilter('month')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                timeFilter === 'month'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:bg-muted'
              }`}
            >
              This Month
            </button>
          </div>
        </div>

        <div className="h-8 w-px bg-border" />

        <div className="flex items-center gap-3">
          <UserCheck className="h-4 w-4 text-muted-foreground" />
          <Label htmlFor="argan-action" className="text-sm font-medium cursor-pointer">
            Action Required by Argan
          </Label>
          <Switch
            id="argan-action"
            checked={arganActionOnly}
            onCheckedChange={setArganActionOnly}
          />
        </div>

        <div className="flex items-center gap-3">
          <Label htmlFor="assigned-me" className="text-sm font-medium cursor-pointer">
            Assigned to Me
          </Label>
          <Switch
            id="assigned-me"
            checked={assignedToMeOnly}
            onCheckedChange={setAssignedToMeOnly}
          />
        </div>
      </div> */}

      {/* Cases List - Main Table */}
      <CallLogList cases={filteredCases} />

      {/* Open and Awaiting Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        {/* Open Calls Widget */}
        <div className="rounded-lg p-4 bg-muted/30 border-2 border-border" style={{
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), 0 3px 6px rgba(0,0,0,0.15)'
        }}>
          <h3 className="text-lg font-semibold mb-3 text-red-600">Open Calls</h3>

          {/* Filter Section */}
          <div className="mb-4 rounded-lg bg-background/50 border">
            <div
              className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => setOpenCallsFiltersExpanded(!openCallsFiltersExpanded)}
            >
              <span className="text-xs font-semibold text-muted-foreground">Filters</span>
              {openCallsFiltersExpanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            {openCallsFiltersExpanded && (
              <div className="px-3 pb-3 space-y-2 border-t pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground min-w-[130px]">Service Tier:</span>
                  <ServiceTierToggle value={openCallsTierFilter} onChange={setOpenCallsTierFilter} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground min-w-[130px]">Action Required By:</span>
                  <ActionRequiredToggle value={openCallsActionFilter} onChange={setOpenCallsActionFilter} />
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground min-w-[80px]">Client:</span>
                    <Select value={openCallsClientFilter} onValueChange={setOpenCallsClientFilter}>
                      <SelectTrigger className="w-[180px] h-8 text-xs">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL" className="text-xs">All</SelectItem>
                        {uniqueClientOptions.map(client => (
                          <SelectItem key={client.id} value={client.id.toString()} className="text-xs">
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground min-w-[80px]">Assigned To:</span>
                    <Select value={openCallsAssignedToFilter} onValueChange={setOpenCallsAssignedToFilter}>
                      <SelectTrigger className="w-[180px] h-8 text-xs">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL" className="text-xs">All</SelectItem>
                        {uniqueAssignedToOptions.map(person => (
                          <SelectItem key={person} value={person} className="text-xs">
                            {person}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto">
            {filterByAssignedTo(
              filterByClient(
                filterByActionRequired(
                  filterByServiceTier(filteredCases.filter(c => c.status === 'OPEN'), openCallsTierFilter),
                  openCallsActionFilter
                ),
                openCallsClientFilter
              ),
              openCallsAssignedToFilter
            ).map(caseItem => (
                <div key={caseItem.id} className="rounded-lg p-3 bg-background hover:bg-muted/30 transition-colors" style={{
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 1px 2px rgba(0,0,0,0.1)'
                }}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-sm">{caseItem.caseId}</p>
                      <p className="text-sm text-muted-foreground">{caseItem.clientName}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{caseItem.creationDate}</span>
                  </div>
                  <p className="text-sm mb-2">{caseItem.title}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Escalated by: {caseItem.escalatedBy}</span>
                    {caseItem.assignedTo && (
                      <span className="text-muted-foreground">Assigned: {caseItem.assignedTo}</span>
                    )}
                  </div>
                </div>
              ))}
            {filterByAssignedTo(
              filterByClient(
                filterByActionRequired(
                  filterByServiceTier(filteredCases.filter(c => c.status === 'OPEN'), openCallsTierFilter),
                  openCallsActionFilter
                ),
                openCallsClientFilter
              ),
              openCallsAssignedToFilter
            ).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No open calls</p>
            )}
          </div>
        </div>

        {/* Awaiting Calls Widget */}
        <div className="rounded-lg p-4 bg-muted/30 border-2 border-border" style={{
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), 0 3px 6px rgba(0,0,0,0.15)'
        }}>
          <h3 className="text-lg font-semibold mb-3 text-amber-600">Awaiting Calls</h3>

          {/* Filter Section */}
          <div className="mb-4 rounded-lg bg-background/50 border">
            <div
              className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => setAwaitingCallsFiltersExpanded(!awaitingCallsFiltersExpanded)}
            >
              <span className="text-xs font-semibold text-muted-foreground">Filters</span>
              {awaitingCallsFiltersExpanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            {awaitingCallsFiltersExpanded && (
              <div className="px-3 pb-3 space-y-2 border-t pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground min-w-[130px]">Service Tier:</span>
                  <ServiceTierToggle value={awaitingCallsTierFilter} onChange={setAwaitingCallsTierFilter} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground min-w-[130px]">Action Required By:</span>
                  <ActionRequiredToggle value={awaitingCallsActionFilter} onChange={setAwaitingCallsActionFilter} />
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground min-w-[80px]">Client:</span>
                    <Select value={awaitingCallsClientFilter} onValueChange={setAwaitingCallsClientFilter}>
                      <SelectTrigger className="w-[180px] h-8 text-xs">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL" className="text-xs">All</SelectItem>
                        {uniqueClientOptions.map(client => (
                          <SelectItem key={client.id} value={client.id.toString()} className="text-xs">
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground min-w-[80px]">Assigned To:</span>
                    <Select value={awaitingCallsAssignedToFilter} onValueChange={setAwaitingCallsAssignedToFilter}>
                      <SelectTrigger className="w-[180px] h-8 text-xs">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL" className="text-xs">All</SelectItem>
                        {uniqueAssignedToOptions.map(person => (
                          <SelectItem key={person} value={person} className="text-xs">
                            {person}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto">
            {filterByAssignedTo(
              filterByClient(
                filterByActionRequired(
                  filterByServiceTier(filteredCases.filter(c => c.status === 'AWAITING'), awaitingCallsTierFilter),
                  awaitingCallsActionFilter
                ),
                awaitingCallsClientFilter
              ),
              awaitingCallsAssignedToFilter
            ).map(caseItem => (
                <div key={caseItem.id} className="rounded-lg p-3 bg-background hover:bg-muted/30 transition-colors" style={{
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 1px 2px rgba(0,0,0,0.1)'
                }}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-sm">{caseItem.caseId}</p>
                      <p className="text-sm text-muted-foreground">{caseItem.clientName}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{caseItem.creationDate}</span>
                  </div>
                  <p className="text-sm mb-2">{caseItem.title}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Escalated by: {caseItem.escalatedBy}</span>
                    {caseItem.assignedTo && (
                      <span className="text-muted-foreground">Assigned: {caseItem.assignedTo}</span>
                    )}
                  </div>
                </div>
              ))}
            {filterByAssignedTo(
              filterByClient(
                filterByActionRequired(
                  filterByServiceTier(filteredCases.filter(c => c.status === 'AWAITING'), awaitingCallsTierFilter),
                  awaitingCallsActionFilter
                ),
                awaitingCallsClientFilter
              ),
              awaitingCallsAssignedToFilter
            ).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No awaiting calls</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
