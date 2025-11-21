'use client';

import { useState, useEffect } from 'react';

import { Plus, User, Calendar, Trash2, Paperclip, Flag, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

import { FileUploadModal } from '@/components/cases/file-upload-modal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import {
  getInteractionsByCaseId,
  createInteraction,
  updateInteraction,
  deleteInteraction,
  getAdminUsers,
  setActiveAction,
  unsetActiveAction,
} from '@/app/admin/(protected)/clients/[id]/cases/actions';

interface Interaction {
  id: number;
  party1Name: string;
  party1Type: string;
  party2Name: string;
  party2Type: string;
  date: string;
  content: string;
  fileCount: number;
  isActiveAction?: boolean;
  actionRequired?: string | null;
  actionRequiredBy?: string | null;
  actionRequiredByDate?: string | null;
}

interface CaseInteractionsWidgetProps {
  caseId: string; // String case ID for display (e.g., "CASE-0001")
  caseNumericId: number; // Numeric case ID for database operations
  clientId: number;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
}

// Mock contractors (TODO: Replace with real data from API when contractor feature is built)
const MOCK_CONTRACTORS = [
  'John Smith - Legal Consultant',
  'Jane Doe - HR Specialist',
  'Bob Wilson - Safety Advisor',
];

/**
 * Case Interactions Widget
 * Shows interaction log for a case and allows adding new interactions
 */
export function CaseInteractionsWidget({ caseId, caseNumericId, clientId }: CaseInteractionsWidgetProps) {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newInteractionText, setNewInteractionText] = useState('');
  const [viewingInteraction, setViewingInteraction] = useState<Interaction | null>(null);
  const [uploadInteractionId, setUploadInteractionId] = useState<number | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [expandedInteractions, setExpandedInteractions] = useState<Set<number>>(new Set());
  const [editingInteraction, setEditingInteraction] = useState<Interaction | null>(null);

  // First party state
  const [party1Type, setParty1Type] = useState<'ARGAN' | 'CLIENT' | 'CONTRACTOR' | 'EMPLOYEE' | 'THIRD_PARTY'>('ARGAN');
  const [party1ArganUser, setParty1ArganUser] = useState('');
  const [party1Contractor, setParty1Contractor] = useState('');
  const [party1FreeText, setParty1FreeText] = useState('');

  // Second party state
  const [party2Type, setParty2Type] = useState<'ARGAN' | 'CLIENT' | 'CONTRACTOR' | 'EMPLOYEE' | 'THIRD_PARTY'>('CLIENT');
  const [party2ArganUser, setParty2ArganUser] = useState('');
  const [party2Contractor, setParty2Contractor] = useState('');
  const [party2FreeText, setParty2FreeText] = useState('');

  // Action required state
  const [actionRequired, setActionRequired] = useState('');
  const [actionRequiredBy, setActionRequiredBy] = useState<'ARGAN' | 'CLIENT' | 'CONTRACTOR' | 'EMPLOYEE' | 'THIRD_PARTY' | ''>('');
  const [actionRequiredByDate, setActionRequiredByDate] = useState<string>('');

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
   * Load interactions when case changes
   */
  useEffect(() => {
    const loadInteractions = async () => {
      const result = await getInteractionsByCaseId(caseNumericId);

      if (result.success && result.data) {
        // Sort by date descending (most recent first)
        // The data comes from the server already sorted by createdAt desc
        setInteractions(result.data);
      } else {
        toast.error(result.error || 'Failed to load interactions');
      }
    };

    loadInteractions();
  }, [caseNumericId]);

  /**
   * Handle adding a new interaction
   */
  const handleAddInteraction = async () => {
    // Determine party 1 name
    let party1Name = '';
    if (party1Type === 'ARGAN') {
      party1Name = party1ArganUser;
    } else if (party1Type === 'CONTRACTOR') {
      party1Name = party1Contractor;
    } else {
      party1Name = party1FreeText;
    }

    // Determine party 2 name
    let party2Name = '';
    if (party2Type === 'ARGAN') {
      party2Name = party2ArganUser;
    } else if (party2Type === 'CONTRACTOR') {
      party2Name = party2Contractor;
    } else {
      party2Name = party2FreeText;
    }

    if (newInteractionText.trim() && party1Name.trim() && party2Name.trim()) {
      const result = await createInteraction({
        caseId: caseNumericId,
        party1Name,
        party1Type,
        party2Name,
        party2Type,
        content: newInteractionText.trim(),
        actionRequired: actionRequired.trim() || null,
        actionRequiredBy: actionRequiredBy || null,
        actionRequiredByDate: actionRequiredByDate || null,
      });

      if (result.success && result.data) {
        // Add new interaction to the list
        setInteractions([result.data, ...interactions]);
        toast.success('Interaction added successfully');

        // Reset form
        setNewInteractionText('');
        setParty1ArganUser('');
        setParty1Contractor('');
        setParty1FreeText('');
        setParty2ArganUser('');
        setParty2Contractor('');
        setParty2FreeText('');
        setParty1Type('ARGAN');
        setParty2Type('CLIENT');
        setActionRequired('');
        setActionRequiredBy('');
        setActionRequiredByDate('');
        setIsDialogOpen(false);
      } else {
        toast.error(result.error || 'Failed to add interaction');
      }
    }
  };

  /**
   * Handle delete interaction
   */
  const handleDeleteInteraction = async (id: number) => {
    const result = await deleteInteraction(id);

    if (result.success) {
      setInteractions(interactions.filter(interaction => interaction.id !== id));
      toast.success('Interaction deleted successfully');
    } else {
      toast.error(result.error || 'Failed to delete interaction');
    }
  };

  /**
   * Toggle expand/collapse for an interaction card
   */
  const toggleExpanded = (interactionId: number) => {
    setExpandedInteractions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(interactionId)) {
        newSet.delete(interactionId);
      } else {
        newSet.add(interactionId);
      }
      return newSet;
    });
  };

  /**
   * Open edit modal for an interaction
   */
  const handleEditInteraction = (interaction: Interaction) => {
    setEditingInteraction(interaction);

    // Populate form fields with interaction data
    setNewInteractionText(interaction.content);
    setActionRequired(interaction.actionRequired || '');
    setActionRequiredBy((interaction.actionRequiredBy as 'ARGAN' | 'CLIENT' | 'CONTRACTOR' | 'EMPLOYEE' | 'THIRD_PARTY') || '');
    setActionRequiredByDate(interaction.actionRequiredByDate || '');

    // Set party 1 data
    setParty1Type(interaction.party1Type as 'ARGAN' | 'CLIENT' | 'CONTRACTOR' | 'EMPLOYEE' | 'THIRD_PARTY');
    if (interaction.party1Type === 'ARGAN') {
      setParty1ArganUser(interaction.party1Name);
    } else if (interaction.party1Type === 'CONTRACTOR') {
      setParty1Contractor(interaction.party1Name);
    } else {
      setParty1FreeText(interaction.party1Name);
    }

    // Set party 2 data
    setParty2Type(interaction.party2Type as 'ARGAN' | 'CLIENT' | 'CONTRACTOR' | 'EMPLOYEE' | 'THIRD_PARTY');
    if (interaction.party2Type === 'ARGAN') {
      setParty2ArganUser(interaction.party2Name);
    } else if (interaction.party2Type === 'CONTRACTOR') {
      setParty2Contractor(interaction.party2Name);
    } else {
      setParty2FreeText(interaction.party2Name);
    }

    setIsDialogOpen(true);
  };

  /**
   * Handle updating an existing interaction
   */
  const handleUpdateInteraction = async () => {
    if (!editingInteraction) return;

    // Determine party 1 name
    let party1Name = '';
    if (party1Type === 'ARGAN') {
      party1Name = party1ArganUser;
    } else if (party1Type === 'CONTRACTOR') {
      party1Name = party1Contractor;
    } else {
      party1Name = party1FreeText;
    }

    // Determine party 2 name
    let party2Name = '';
    if (party2Type === 'ARGAN') {
      party2Name = party2ArganUser;
    } else if (party2Type === 'CONTRACTOR') {
      party2Name = party2Contractor;
    } else {
      party2Name = party2FreeText;
    }

    if (newInteractionText.trim() && party1Name.trim() && party2Name.trim()) {
      const result = await updateInteraction(editingInteraction.id, {
        party1Name,
        party1Type,
        party2Name,
        party2Type,
        content: newInteractionText.trim(),
        actionRequired: actionRequired.trim() || null,
        actionRequiredBy: actionRequiredBy || null,
        actionRequiredByDate: actionRequiredByDate || null,
      });

      if (result.success && result.data) {
        // Update the interaction in the list
        setInteractions(interactions.map(i =>
          i.id === editingInteraction.id ? result.data! : i
        ));
        toast.success('Interaction updated successfully');

        // Reset form and close dialog
        setNewInteractionText('');
        setParty1ArganUser('');
        setParty1Contractor('');
        setParty1FreeText('');
        setParty2ArganUser('');
        setParty2Contractor('');
        setParty2FreeText('');
        setParty1Type('ARGAN');
        setParty2Type('CLIENT');
        setActionRequired('');
        setActionRequiredBy('');
        setActionRequiredByDate('');
        setEditingInteraction(null);
        setIsDialogOpen(false);
      } else {
        toast.error(result.error || 'Failed to update interaction');
      }
    }
  };

  /**
   * Handle toggle active action flag
   */
  const handleToggleActiveAction = async (interaction: Interaction) => {
    // If this interaction is already active, unset it
    if (interaction.isActiveAction) {
      const result = await unsetActiveAction(interaction.id, clientId);

      if (result.success) {
        // Update local state
        setInteractions(interactions.map(i =>
          i.id === interaction.id ? { ...i, isActiveAction: false } : i
        ));

        // If we're editing this interaction, update the editing state too
        if (editingInteraction && editingInteraction.id === interaction.id) {
          setEditingInteraction({ ...editingInteraction, isActiveAction: false });
        }

        toast.success('Active action cleared');
      } else {
        toast.error(result.error || 'Failed to clear active action');
      }
    } else {
      // Otherwise, set this as the active action
      const result = await setActiveAction(interaction.id, clientId);

      if (result.success) {
        // Update local state - unset all others and set this one
        setInteractions(interactions.map(i => ({
          ...i,
          isActiveAction: i.id === interaction.id,
        })));

        // If we're editing any interaction, update its state
        if (editingInteraction) {
          setEditingInteraction({
            ...editingInteraction,
            isActiveAction: editingInteraction.id === interaction.id,
          });
        }

        toast.success('Active action set');
      } else {
        toast.error(result.error || 'Failed to set active action');
      }
    }
  };

  /**
   * Get badge color for interaction type
   */
  const getInteractionTypeBadge = (type: string): string => {
    switch (type) {
      case 'ARGAN':
        return 'bg-green-100 text-green-900';
      case 'CLIENT':
        return 'bg-gray-100 text-gray-900';
      case 'CONTRACTOR':
        return 'bg-blue-100 text-blue-700';
      case 'EMPLOYEE':
        return 'bg-yellow-100 text-yellow-700';
      case 'THIRD_PARTY':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  /**
   * Get initials from name
   */
  const getInitials = (name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  /**
   * Render avatar with initials for Argan users
   */
  const renderAvatar = (name: string, type: string) => {
    if (type !== 'ARGAN') return null;

    return (
      <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-600 text-white text-xs font-medium mr-1.5">
        {getInitials(name)}
      </div>
    );
  };

  return (
    <>
      <Card className="bg-muted/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Interaction Log</CardTitle>
          <Button
            size="sm"
            onClick={() => {
              setEditingInteraction(null);
              setIsDialogOpen(true);
            }}
            className="h-8"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Interaction
          </Button>
        </CardHeader>
        <CardContent>
          {interactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="rounded-full bg-muted p-3 mb-3">
                <User className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                No interactions recorded yet
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingInteraction(null);
                  setIsDialogOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add First Interaction
              </Button>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {interactions.map((interaction) => {
                const isExpanded = expandedInteractions.has(interaction.id);
                return (
                  <div
                    key={interaction.id}
                    className={`border border-green-700 rounded-lg p-3 bg-card hover:shadow-sm transition-shadow group relative ${!isExpanded ? 'cursor-pointer' : ''}`}
                    onClick={() => !isExpanded && handleEditInteraction(interaction)}
                  >
                    {/* Chevron button in top left */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpanded(interaction.id);
                      }}
                      className="absolute top-3 left-3 h-6 w-6 text-muted-foreground hover:text-foreground z-10"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>

                    {/* Action buttons in top right */}
                    <div className="absolute top-3 right-3 flex items-center gap-1">
                      {/* Flag button - always visible if active, shown on hover otherwise */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleActiveAction(interaction);
                        }}
                        className={`h-7 w-7 transition-opacity ${
                          interaction.isActiveAction
                            ? 'text-orange-600 hover:text-orange-700'
                            : 'opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground'
                        }`}
                        title={interaction.isActiveAction ? 'Clear active action' : 'Set as active action'}
                      >
                        <Flag className={`h-3.5 w-3.5 ${interaction.isActiveAction ? 'fill-current' : ''}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadInteractionId(interaction.id);
                          setIsUploadModalOpen(true);
                        }}
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                      >
                        <Paperclip className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteInteraction(interaction.id);
                        }}
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {/* Content area with padding to avoid buttons on both sides */}
                    <div className="pl-10 pr-28 space-y-3">
                      {/* Interaction Between section - always visible */}
                      <div className="border rounded-lg p-3 bg-muted/30">
                        {isExpanded ? (
                          <>
                            {/* Expanded view - header with date */}
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-semibold">Interaction Between...</span>
                              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span>{interaction.date}</span>
                              </div>
                            </div>

                            {/* First party - light grey text, smaller */}
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">{interaction.party1Name}</span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getInteractionTypeBadge(interaction.party1Type)}`}>
                                {interaction.party1Type}
                              </span>
                            </div>

                            {/* "and" separator */}
                            <div className="text-xs text-muted-foreground my-1">and</div>

                            {/* Second party - light grey text, smaller */}
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">{interaction.party2Name}</span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getInteractionTypeBadge(interaction.party2Type)}`}>
                                {interaction.party2Type}
                              </span>
                            </div>
                          </>
                        ) : (
                          <>
                            {/* Collapsed view - 4 column x 2 row grid */}
                            {/* Col 1: 1fr (equal) | Col 2: arrow width | Col 3: 1fr (equal) | Col 4: fixed 110px for badge/date */}
                            <div className="grid grid-cols-[1fr_auto_1fr_110px] grid-rows-2 gap-x-2 gap-y-1 h-[75px]">
                              {/* Row 1, Col 1-3: "Interaction Between..." spans 3 columns */}
                              <div className="col-start-1 col-span-3 row-start-1 flex items-center">
                                <span className="text-sm font-semibold">Interaction Between...</span>
                              </div>

                              {/* Row 1, Col 4: Action Badge */}
                              <div className="col-start-4 row-start-1 flex items-center justify-end">
                                {interaction.actionRequiredBy && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs">⚠️</span>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getInteractionTypeBadge(interaction.actionRequiredBy)}`}>
                                      {interaction.actionRequiredBy}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Row 2, Col 1: Party 1 Name */}
                              <div className="col-start-1 row-start-2 flex items-center">
                                <span className="text-xs text-muted-foreground">{interaction.party1Name}</span>
                              </div>

                              {/* Row 2, Col 2: Arrow */}
                              <div className="col-start-2 row-start-2 flex items-center justify-center">
                                <span className="text-xs text-muted-foreground">↔</span>
                              </div>

                              {/* Row 2, Col 3: Party 2 Name */}
                              <div className="col-start-3 row-start-2 flex items-center">
                                <span className="text-xs text-muted-foreground">{interaction.party2Name}</span>
                              </div>

                              {/* Row 2, Col 4: Date */}
                              <div className="col-start-4 row-start-2 flex items-center justify-end">
                                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  <span>{interaction.date}</span>
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Expanded content */}
                      {isExpanded && (
                        <div className="border rounded-lg p-3 bg-muted/30 space-y-2">
                          {/* Action Required section at top if set */}
                          {(interaction.actionRequiredBy || interaction.actionRequired) && (
                            <div className="flex items-start gap-2 pb-2 border-b">
                              <span className="text-base">⚠️</span>
                              <div className="flex-1 space-y-1">
                                {/* Action Required By row */}
                                {interaction.actionRequiredBy && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-muted-foreground">Action Required By:</span>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getInteractionTypeBadge(interaction.actionRequiredBy)}`}>
                                      {interaction.actionRequiredBy}
                                    </span>
                                  </div>
                                )}
                                {/* Action Required text row */}
                                {interaction.actionRequired && (
                                  <div>
                                    <span className="text-xs font-semibold text-muted-foreground">Action Required: </span>
                                    <span className="text-xs text-muted-foreground" title={interaction.actionRequired}>
                                      {interaction.actionRequired}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Interaction Details */}
                          <div className="space-y-1">
                            <span className="text-[11px] font-semibold text-muted-foreground">Interaction Details:</span>
                            <p className="text-[11px] text-muted-foreground" title={interaction.content}>
                              {interaction.content}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Interaction Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          setEditingInteraction(null);
        }
      }}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingInteraction ? 'Edit Interaction' : 'Add Interaction'}</DialogTitle>
            <DialogDescription>
              {editingInteraction ? `Edit interaction for case ${caseId}` : `Record a new interaction for case ${caseId}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 overflow-y-auto flex-1">
            {/* Interaction Between */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Interaction Between</Label>

              {/* First Party */}
              <div className="grid grid-cols-2 gap-4">
                <Select value={party1Type} onValueChange={(value) => setParty1Type(value as 'ARGAN' | 'CLIENT' | 'CONTRACTOR' | 'EMPLOYEE' | 'THIRD_PARTY')}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select party type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ARGAN">Argan</SelectItem>
                    <SelectItem value="CLIENT">Client</SelectItem>
                    <SelectItem value="CONTRACTOR">Contractor</SelectItem>
                    <SelectItem value="EMPLOYEE">Employee</SelectItem>
                    <SelectItem value="THIRD_PARTY">Third Party</SelectItem>
                  </SelectContent>
                </Select>

                {/* Conditional field for party 1 */}
                {party1Type === 'ARGAN' && (
                  <Select value={party1ArganUser} onValueChange={setParty1ArganUser}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select team member" />
                    </SelectTrigger>
                    <SelectContent>
                      {adminUsers.map((admin) => (
                        <SelectItem key={admin.id} value={admin.name}>
                          {admin.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {party1Type === 'CONTRACTOR' && (
                  <Select value={party1Contractor} onValueChange={setParty1Contractor}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select contractor" />
                    </SelectTrigger>
                    <SelectContent>
                      {MOCK_CONTRACTORS.map((contractor) => (
                        <SelectItem key={contractor} value={contractor}>
                          {contractor}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {(party1Type === 'CLIENT' || party1Type === 'EMPLOYEE' || party1Type === 'THIRD_PARTY') && (
                  <Input
                    placeholder={
                      party1Type === 'CLIENT'
                        ? 'Enter client contact name'
                        : party1Type === 'EMPLOYEE'
                        ? 'Enter employee name'
                        : 'Enter third party name'
                    }
                    value={party1FreeText}
                    onChange={(e) => setParty1FreeText(e.target.value)}
                    className="w-full"
                  />
                )}
              </div>

              {/* And separator */}
              <div className="flex items-center justify-center">
                <span className="text-sm font-medium text-muted-foreground">And</span>
              </div>

              {/* Second Party */}
              <div className="grid grid-cols-2 gap-4">
                <Select value={party2Type} onValueChange={(value) => setParty2Type(value as 'ARGAN' | 'CLIENT' | 'CONTRACTOR' | 'EMPLOYEE' | 'THIRD_PARTY')}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select party type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ARGAN">Argan</SelectItem>
                    <SelectItem value="CLIENT">Client</SelectItem>
                    <SelectItem value="CONTRACTOR">Contractor</SelectItem>
                    <SelectItem value="EMPLOYEE">Employee</SelectItem>
                    <SelectItem value="THIRD_PARTY">Third Party</SelectItem>
                  </SelectContent>
                </Select>

                {/* Conditional field for party 2 */}
                {party2Type === 'ARGAN' && (
                  <Select value={party2ArganUser} onValueChange={setParty2ArganUser}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select team member" />
                    </SelectTrigger>
                    <SelectContent>
                      {adminUsers.map((admin) => (
                        <SelectItem key={admin.id} value={admin.name}>
                          {admin.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {party2Type === 'CONTRACTOR' && (
                  <Select value={party2Contractor} onValueChange={setParty2Contractor}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select contractor" />
                    </SelectTrigger>
                    <SelectContent>
                      {MOCK_CONTRACTORS.map((contractor) => (
                        <SelectItem key={contractor} value={contractor}>
                          {contractor}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {(party2Type === 'CLIENT' || party2Type === 'EMPLOYEE' || party2Type === 'THIRD_PARTY') && (
                  <Input
                    placeholder={
                      party2Type === 'CLIENT'
                        ? 'Enter client contact name'
                        : party2Type === 'EMPLOYEE'
                        ? 'Enter employee name'
                        : 'Enter third party name'
                    }
                    value={party2FreeText}
                    onChange={(e) => setParty2FreeText(e.target.value)}
                    className="w-full"
                  />
                )}
              </div>
            </div>

            {/* Action Required Section */}
            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Action Required (Optional)</Label>
                {editingInteraction && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      handleToggleActiveAction(editingInteraction);
                    }}
                    className={`h-7 w-7 p-0 ${
                      editingInteraction.isActiveAction
                        ? 'text-orange-600 hover:text-orange-700'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    title={editingInteraction.isActiveAction ? 'Clear active action' : 'Set as active action'}
                  >
                    <Flag className={`h-4 w-4 ${editingInteraction.isActiveAction ? 'fill-current' : ''}`} />
                  </Button>
                )}
              </div>

              {/* Action Required By */}
              <div className="space-y-2">
                <Label htmlFor="action-required-by" className="text-sm">Action Required By</Label>
                <Select value={actionRequiredBy} onValueChange={(value) => setActionRequiredBy(value as 'ARGAN' | 'CLIENT' | 'CONTRACTOR' | 'EMPLOYEE' | 'THIRD_PARTY' | '')}>
                  <SelectTrigger id="action-required-by" className="w-full">
                    <SelectValue placeholder="Select who needs to take action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">None</SelectItem>
                    <SelectItem value="ARGAN">Argan</SelectItem>
                    <SelectItem value="CLIENT">Client</SelectItem>
                    <SelectItem value="CONTRACTOR">Contractor</SelectItem>
                    <SelectItem value="EMPLOYEE">Employee</SelectItem>
                    <SelectItem value="THIRD_PARTY">Third Party</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Action Required Text */}
              <div className="space-y-2">
                <Label htmlFor="action-required-text" className="text-sm">Action Required</Label>
                <Input
                  id="action-required-text"
                  placeholder="Describe the action that needs to be taken..."
                  value={actionRequired}
                  onChange={(e) => setActionRequired(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Action Required By Date */}
              <div className="space-y-2">
                <Label htmlFor="action-required-by-date" className="text-sm">Action Required By Date</Label>
                <Input
                  id="action-required-by-date"
                  type="date"
                  value={actionRequiredByDate}
                  onChange={(e) => setActionRequiredByDate(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            {/* Interaction Content */}
            <div className="space-y-2">
              <Label htmlFor="interaction-content">Interaction Details</Label>
              <Textarea
                id="interaction-content"
                placeholder="Enter what was discussed or any relevant notes..."
                className="min-h-[150px] resize-none"
                value={newInteractionText}
                onChange={(e) => setNewInteractionText(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={editingInteraction ? handleUpdateInteraction : handleAddInteraction}
              disabled={
                !newInteractionText.trim() ||
                // Party 1 validation
                (party1Type === 'ARGAN' && !party1ArganUser) ||
                (party1Type === 'CONTRACTOR' && !party1Contractor) ||
                ((party1Type === 'CLIENT' || party1Type === 'EMPLOYEE' || party1Type === 'THIRD_PARTY') && !party1FreeText.trim()) ||
                // Party 2 validation
                (party2Type === 'ARGAN' && !party2ArganUser) ||
                (party2Type === 'CONTRACTOR' && !party2Contractor) ||
                ((party2Type === 'CLIENT' || party2Type === 'EMPLOYEE' || party2Type === 'THIRD_PARTY') && !party2FreeText.trim())
              }
            >
              {editingInteraction ? 'Save Changes' : 'Add Interaction'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Interaction Dialog */}
      <Dialog open={!!viewingInteraction} onOpenChange={() => setViewingInteraction(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Interaction Details</DialogTitle>
            <DialogDescription>
              Case {caseId}
            </DialogDescription>
          </DialogHeader>
          {viewingInteraction && (
            <div className="space-y-4 py-4">
              {/* Interaction Between */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-muted-foreground">Interaction Between</Label>

                {/* First party */}
                <div className="flex items-center gap-1.5">
                  {renderAvatar(viewingInteraction.party1Name, viewingInteraction.party1Type)}
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getInteractionTypeBadge(viewingInteraction.party1Type)}`}>
                    {viewingInteraction.party1Type}
                  </span>
                  <span className="text-sm font-medium">{viewingInteraction.party1Name}</span>
                </div>

                <div className="text-xs text-muted-foreground ml-1">And</div>

                {/* Second party */}
                <div className="flex items-center gap-1.5">
                  {renderAvatar(viewingInteraction.party2Name, viewingInteraction.party2Type)}
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getInteractionTypeBadge(viewingInteraction.party2Type)}`}>
                    {viewingInteraction.party2Type}
                  </span>
                  <span className="text-sm font-medium">{viewingInteraction.party2Name}</span>
                </div>
              </div>

              {/* Timestamp */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-muted-foreground">Date</Label>
                <div className="flex items-center gap-1 text-sm">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{viewingInteraction.date}</span>
                </div>
              </div>

              {/* Full content */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-muted-foreground">Interaction Details</Label>
                <div className="border rounded-lg p-4 bg-muted/30 max-h-[400px] overflow-y-auto">
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {viewingInteraction.content}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingInteraction(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* File Upload Modal */}
      <FileUploadModal
        open={isUploadModalOpen}
        onOpenChange={(open) => {
          setIsUploadModalOpen(open);
          if (!open) setUploadInteractionId(null);
        }}
        caseId={caseId}
        clientId={clientId}
        interactionId={uploadInteractionId}
        onUploadSuccess={() => {
          console.log('File uploaded successfully to interaction:', uploadInteractionId);
          // TODO: Refresh file list
        }}
      />
    </>
  );
}
