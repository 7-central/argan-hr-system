'use client';

import { useState } from 'react';

import { Plus, User, Calendar, Trash2, Paperclip } from 'lucide-react';

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

interface Interaction {
  id: number;
  author: string;
  authorType: 'ARGAN' | 'CLIENT' | 'CONTRACTOR' | 'EMPLOYEE';
  date: string;
  time: string;
  content: string;
}

interface CaseInteractionsWidgetProps {
  caseId: string;
  clientId: number;
}

// Mock admin users (TODO: Replace with real data from API)
const MOCK_ADMIN_USERS = [
  'Kim Fletcher',
  'Ric Thompson',
  'Sue Davies',
];

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
export function CaseInteractionsWidget({ caseId, clientId }: CaseInteractionsWidgetProps) {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newInteractionText, setNewInteractionText] = useState('');
  const [viewingInteraction, setViewingInteraction] = useState<Interaction | null>(null);
  const [uploadInteractionId, setUploadInteractionId] = useState<number | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // First party state
  const [party1Type, setParty1Type] = useState<'ARGAN' | 'CLIENT' | 'CONTRACTOR' | 'EMPLOYEE'>('ARGAN');
  const [party1ArganUser, setParty1ArganUser] = useState('');
  const [party1Contractor, setParty1Contractor] = useState('');
  const [party1FreeText, setParty1FreeText] = useState('');

  // Second party state
  const [party2Type, setParty2Type] = useState<'ARGAN' | 'CLIENT' | 'CONTRACTOR' | 'EMPLOYEE'>('CLIENT');
  const [party2ArganUser, setParty2ArganUser] = useState('');
  const [party2Contractor, setParty2Contractor] = useState('');
  const [party2FreeText, setParty2FreeText] = useState('');

  /**
   * Handle adding a new interaction
   */
  const handleAddInteraction = () => {
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
      const now = new Date();
      // Create interaction with both parties in the author field
      const authorDisplay = `${party1Name} (${party1Type}) → ${party2Name} (${party2Type})`;

      const newInteraction: Interaction = {
        id: interactions.length + 1,
        author: authorDisplay,
        authorType: party1Type, // Use party1Type for the badge color
        date: now.toLocaleDateString('en-GB'),
        time: now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        content: newInteractionText.trim(),
      };

      setInteractions([newInteraction, ...interactions]);

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
      setIsDialogOpen(false);
    }
  };

  /**
   * Handle delete interaction
   */
  const handleDeleteInteraction = (id: number) => {
    setInteractions(interactions.filter(interaction => interaction.id !== id));
    // TODO: Call API to delete interaction
  };

  /**
   * Get badge color for interaction type
   */
  const getInteractionTypeBadge = (type: string): string => {
    switch (type) {
      case 'ARGAN':
        return 'bg-green-100 text-green-700';
      case 'CLIENT':
        return 'bg-gray-100 text-gray-700';
      case 'CONTRACTOR':
        return 'bg-blue-100 text-blue-700';
      case 'EMPLOYEE':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Interaction Log</CardTitle>
          <Button
            size="sm"
            onClick={() => setIsDialogOpen(true)}
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
                onClick={() => setIsDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add First Interaction
              </Button>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {interactions.map((interaction) => {
                // Parse the author string to extract both parties
                const authorMatch = interaction.author.match(/^(.+?) \((.+?)\) → (.+?) \((.+?)\)$/);
                const party1Name = authorMatch ? authorMatch[1] : interaction.author;
                const party1Type = authorMatch ? authorMatch[2] : interaction.authorType;
                const party2Name = authorMatch ? authorMatch[3] : '';
                const party2Type = authorMatch ? authorMatch[4] : '';

                // Get first line of content for preview
                const firstLine = interaction.content.split('\n')[0];
                const contentPreview = firstLine.length > 80
                  ? firstLine.substring(0, 80) + '...'
                  : firstLine + (interaction.content.includes('\n') || interaction.content.length > firstLine.length ? '...' : '');

                return (
                  <div
                    key={interaction.id}
                    onClick={() => setViewingInteraction(interaction)}
                    className="border rounded-lg p-3 bg-card hover:shadow-sm transition-shadow cursor-pointer group relative"
                  >
                    {/* Action buttons in top right */}
                    <div className="absolute top-3 right-3 flex items-center gap-1">
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

                    {/* Content area with left padding to avoid action buttons */}
                    <div className="pr-16">
                      {/* First party */}
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getInteractionTypeBadge(party1Type)}`}>
                          {party1Type}
                        </span>
                        <span className="text-sm font-medium">{party1Name}</span>
                      </div>

                      {/* "And" separator */}
                      <div className="text-xs text-muted-foreground mb-1 ml-1">And</div>

                      {/* Second party */}
                      {party2Name && (
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getInteractionTypeBadge(party2Type)}`}>
                            {party2Type}
                          </span>
                          <span className="text-sm font-medium">{party2Name}</span>
                        </div>
                      )}

                      {/* Content preview */}
                      <p className="text-sm text-foreground mb-2 line-clamp-1">
                        {contentPreview}
                      </p>

                      {/* Timestamp */}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{interaction.date}</span>
                        <span>at</span>
                        <span>{interaction.time}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Interaction Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Add Interaction</DialogTitle>
            <DialogDescription>
              Record a new interaction for case {caseId}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Interaction Between */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Interaction Between</Label>

              {/* First Party */}
              <div className="grid grid-cols-2 gap-4">
                <Select value={party1Type} onValueChange={(value: any) => setParty1Type(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select party type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ARGAN">Argan</SelectItem>
                    <SelectItem value="CLIENT">Client</SelectItem>
                    <SelectItem value="CONTRACTOR">Contractor</SelectItem>
                    <SelectItem value="EMPLOYEE">Employee</SelectItem>
                  </SelectContent>
                </Select>

                {/* Conditional field for party 1 */}
                {party1Type === 'ARGAN' && (
                  <Select value={party1ArganUser} onValueChange={setParty1ArganUser}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select team member" />
                    </SelectTrigger>
                    <SelectContent>
                      {MOCK_ADMIN_USERS.map((user) => (
                        <SelectItem key={user} value={user}>
                          {user}
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

                {(party1Type === 'CLIENT' || party1Type === 'EMPLOYEE') && (
                  <Input
                    placeholder={party1Type === 'CLIENT' ? 'Enter client contact name' : 'Enter employee name'}
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
                <Select value={party2Type} onValueChange={(value: any) => setParty2Type(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select party type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ARGAN">Argan</SelectItem>
                    <SelectItem value="CLIENT">Client</SelectItem>
                    <SelectItem value="CONTRACTOR">Contractor</SelectItem>
                    <SelectItem value="EMPLOYEE">Employee</SelectItem>
                  </SelectContent>
                </Select>

                {/* Conditional field for party 2 */}
                {party2Type === 'ARGAN' && (
                  <Select value={party2ArganUser} onValueChange={setParty2ArganUser}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select team member" />
                    </SelectTrigger>
                    <SelectContent>
                      {MOCK_ADMIN_USERS.map((user) => (
                        <SelectItem key={user} value={user}>
                          {user}
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

                {(party2Type === 'CLIENT' || party2Type === 'EMPLOYEE') && (
                  <Input
                    placeholder={party2Type === 'CLIENT' ? 'Enter client contact name' : 'Enter employee name'}
                    value={party2FreeText}
                    onChange={(e) => setParty2FreeText(e.target.value)}
                    className="w-full"
                  />
                )}
              </div>
            </div>

            {/* Interaction Content */}
            <div className="space-y-2">
              <Label htmlFor="interaction-content">Interaction Details</Label>
              <Textarea
                id="interaction-content"
                placeholder="Enter what was discussed or any relevant notes..."
                className="min-h-[300px] resize-none"
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
              onClick={handleAddInteraction}
              disabled={
                !newInteractionText.trim() ||
                // Party 1 validation
                (party1Type === 'ARGAN' && !party1ArganUser) ||
                (party1Type === 'CONTRACTOR' && !party1Contractor) ||
                ((party1Type === 'CLIENT' || party1Type === 'EMPLOYEE') && !party1FreeText.trim()) ||
                // Party 2 validation
                (party2Type === 'ARGAN' && !party2ArganUser) ||
                (party2Type === 'CONTRACTOR' && !party2Contractor) ||
                ((party2Type === 'CLIENT' || party2Type === 'EMPLOYEE') && !party2FreeText.trim())
              }
            >
              Add Interaction
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
          {viewingInteraction && (() => {
            // Parse the author string to extract both parties
            const authorMatch = viewingInteraction.author.match(/^(.+?) \((.+?)\) → (.+?) \((.+?)\)$/);
            const party1Name = authorMatch ? authorMatch[1] : viewingInteraction.author;
            const party1Type = authorMatch ? authorMatch[2] : viewingInteraction.authorType;
            const party2Name = authorMatch ? authorMatch[3] : '';
            const party2Type = authorMatch ? authorMatch[4] : '';

            return (
              <div className="space-y-4 py-4">
                {/* Interaction Between */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-muted-foreground">Interaction Between</Label>

                  {/* First party */}
                  <div className="flex items-center gap-1.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getInteractionTypeBadge(party1Type)}`}>
                      {party1Type}
                    </span>
                    <span className="text-sm font-medium">{party1Name}</span>
                  </div>

                  <div className="text-xs text-muted-foreground ml-1">And</div>

                  {/* Second party */}
                  {party2Name && (
                    <div className="flex items-center gap-1.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getInteractionTypeBadge(party2Type)}`}>
                        {party2Type}
                      </span>
                      <span className="text-sm font-medium">{party2Name}</span>
                    </div>
                  )}
                </div>

                {/* Timestamp */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-muted-foreground">Date & Time</Label>
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{viewingInteraction.date}</span>
                    <span>at</span>
                    <span>{viewingInteraction.time}</span>
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
            );
          })()}
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
