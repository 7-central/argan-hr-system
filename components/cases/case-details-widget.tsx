'use client';

import { useState } from 'react';

import { Save, Check, Trash2, Paperclip } from 'lucide-react';

import { FileUploadModal } from '@/components/cases/file-upload-modal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface CaseDetailsWidgetProps {
  caseData: {
    caseId: string;
    title: string;
    creationDate: string;
    status: string;
    actionRequired: string | null;
    escalatedBy: string;
    assignedTo: string | null;
  };
  clientId: number;
}

/**
 * Case Details Widget
 * Shows detailed information about a selected case
 */
export function CaseDetailsWidget({ caseData, clientId }: CaseDetailsWidgetProps) {
  const [title, setTitle] = useState(caseData.title);
  const [escalatedBy, setEscalatedBy] = useState(caseData.escalatedBy);
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

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
      return 'bg-muted text-muted-foreground';
    }
    switch (actionRequired) {
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

  /**
   * Handle save all changes
   */
  const handleSave = async () => {
    setIsSaving(true);
    setIsSaved(false);

    // TODO: Call API to save all changes (title, escalatedBy, description)
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call

    setIsSaving(false);
    setIsSaved(true);

    // Reset saved indicator after 2 seconds
    setTimeout(() => {
      setIsSaved(false);
    }, 2000);
  };

  /**
   * Handle delete case
   */
  const handleDeleteCase = () => {
    console.log(`Delete case: ${caseData.caseId}`);
    // TODO: Show confirmation dialog and call API to delete case
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Case Details</CardTitle>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsUploadModalOpen(true)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSave}
            disabled={isSaving}
            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
          >
            {isSaved ? (
              <Check className="h-4 w-4" />
            ) : (
              <Save className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDeleteCase}
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Case ID */}
        <div className="grid grid-cols-3 gap-2">
          <Label className="text-sm font-semibold text-muted-foreground">Case ID</Label>
          <div className="col-span-2 text-sm font-medium">{caseData.caseId}</div>
        </div>

        {/* Case Title */}
        <div className="grid grid-cols-3 gap-2 items-center">
          <Label className="text-sm font-semibold text-muted-foreground">Title</Label>
          <div className="col-span-2">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        </div>

        {/* Escalated By */}
        <div className="grid grid-cols-3 gap-2 items-center">
          <Label className="text-sm font-semibold text-muted-foreground">Escalated By</Label>
          <div className="col-span-2">
            <Input
              value={escalatedBy}
              onChange={(e) => setEscalatedBy(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        </div>

        {/* Assigned To */}
        <div className="grid grid-cols-3 gap-2">
          <Label className="text-sm font-semibold text-muted-foreground">Assigned To</Label>
          <div className="col-span-2 text-sm">{caseData.assignedTo || '-'}</div>
        </div>

        {/* Case Status */}
        <div className="grid grid-cols-3 gap-2">
          <Label className="text-sm font-semibold text-muted-foreground">Case Status</Label>
          <div className="col-span-2">
            <div className="flex items-center gap-2">
              <div className={`h-2.5 w-2.5 rounded-full ${getStatusDotColor(caseData.status)}`} />
              <span className="text-sm">{caseData.status}</span>
            </div>
          </div>
        </div>

        {/* Action Required By */}
        <div className="grid grid-cols-3 gap-2">
          <Label className="text-sm font-semibold text-muted-foreground">Action Required By</Label>
          <div className="col-span-2">
            <span className={`inline-flex items-center justify-center px-3 py-1 rounded text-sm font-medium w-[110px] ${getActionRequiredColor(caseData.actionRequired)}`}>
              {caseData.actionRequired || '-'}
            </span>
          </div>
        </div>

        {/* Creation Date */}
        <div className="grid grid-cols-3 gap-2">
          <Label className="text-sm font-semibold text-muted-foreground">Creation Date</Label>
          <div className="col-span-2 text-sm">{caseData.creationDate}</div>
        </div>

        {/* Case Description */}
        <div className="space-y-2 pt-2 border-t">
          <Label htmlFor="case-description" className="text-sm font-semibold">
            Case Description
          </Label>
          <Textarea
            id="case-description"
            placeholder="Enter detailed information about this case..."
            className="min-h-[150px] resize-none"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </CardContent>

      {/* File Upload Modal */}
      <FileUploadModal
        open={isUploadModalOpen}
        onOpenChange={setIsUploadModalOpen}
        caseId={caseData.caseId}
        clientId={clientId}
        interactionId={null}
        onUploadSuccess={() => {
          console.log('File uploaded successfully');
          // TODO: Refresh file list
        }}
      />
    </Card>
  );
}
