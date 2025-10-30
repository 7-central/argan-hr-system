'use client';

import { useState, useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { Trash2, Paperclip } from 'lucide-react';
import { toast } from 'sonner';

import { FileUploadModal } from '@/components/cases/file-upload-modal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

import { deleteCase, updateCase, getAdminUsers } from '@/app/admin/(protected)/clients/[id]/cases/actions';

interface AdminUser {
  id: string;
  name: string;
  email: string;
}

interface CaseDetailsWidgetProps {
  caseData: {
    id: number; // Numeric ID for database operations
    caseId: string;
    title: string;
    creationDate: string;
    status: string;
    actionRequiredBy: 'ARGAN' | 'CLIENT' | 'CONTRACTOR' | 'EMPLOYEE' | null;
    actionRequired: string | null;
    escalatedBy: string;
    assignedTo: string | null;
    description: string | null;
  };
  clientId: number;
  onCaseDeleted?: () => void;
}

/**
 * Case Details Widget
 * Shows detailed information about a selected case
 */
export function CaseDetailsWidget({ caseData, clientId, onCaseDeleted }: CaseDetailsWidgetProps) {
  const router = useRouter();
  const [title, setTitle] = useState(caseData.title);
  const [escalatedBy, setEscalatedBy] = useState(caseData.escalatedBy);
  const [description, setDescription] = useState(caseData.description || '');
  const [actionRequiredText, setActionRequiredText] = useState(caseData.actionRequired || '');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);

  /**
   * Load admin users on mount
   */
  useEffect(() => {
    const loadAdminUsers = async () => {
      const result = await getAdminUsers();
      if (result.success && result.data) {
        setAdminUsers(result.data);
      }
    };
    loadAdminUsers();
  }, []);

  /**
   * Sync local state with prop changes when a different case is selected
   */
  useEffect(() => {
    setTitle(caseData.title);
    setEscalatedBy(caseData.escalatedBy);
    setDescription(caseData.description || '');
    setActionRequiredText(caseData.actionRequired || '');
  }, [caseData]);

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
   * Auto-save handler for text fields (on blur)
   */
  const handleFieldSave = async (field: 'title' | 'escalatedBy' | 'actionRequired' | 'description', value: string) => {
    try {
      const result = await updateCase(caseData.id, { [field]: value || null });
      if (result.success) {
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to save changes');
      }
    } catch {
      toast.error('An unexpected error occurred');
    }
  };

  /**
   * Auto-save handler for dropdown fields (immediate save)
   */
  const handleDropdownSave = async (field: 'status' | 'actionRequiredBy' | 'assignedTo', value: string | null) => {
    try {
      const result = await updateCase(caseData.id, { [field]: value });
      if (result.success) {
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to save changes');
      }
    } catch {
      toast.error('An unexpected error occurred');
    }
  };

  /**
   * Handle delete case
   */
  const handleDeleteCase = async () => {
    // Confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete case ${caseData.caseId}?\n\nThis will permanently delete the case and all its interactions. This action cannot be undone.`
    );

    if (!confirmed) return;

    setIsDeleting(true);

    try {
      const result = await deleteCase(caseData.id, clientId);

      if (result.success) {
        toast.success('Case deleted successfully');

        // Close the widget by deselecting the case
        if (onCaseDeleted) {
          onCaseDeleted();
        }

        // Refresh the page to update the list
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to delete case');
        setIsDeleting(false);
      }
    } catch {
      toast.error('An unexpected error occurred');
      setIsDeleting(false);
    }
  };

  return (
    <Card className="bg-muted/50">
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
            onClick={handleDeleteCase}
            disabled={isDeleting}
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
              onBlur={() => handleFieldSave('title', title)}
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
              onBlur={() => handleFieldSave('escalatedBy', escalatedBy)}
              className="h-8 text-sm"
            />
          </div>
        </div>

        {/* Assigned To */}
        <div className="grid grid-cols-3 gap-2">
          <Label className="text-sm font-semibold text-muted-foreground">Assigned To</Label>
          <div className="col-span-2">
            <Select
              value={caseData.assignedTo || 'none'}
              onValueChange={(value) => handleDropdownSave('assignedTo', value === 'none' ? null : value)}
            >
              <SelectTrigger className="h-8 w-full text-sm">
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
        </div>

        {/* Case Status */}
        <div className="grid grid-cols-3 gap-2">
          <Label className="text-sm font-semibold text-muted-foreground">Case Status</Label>
          <div className="col-span-2">
            <Select
              value={caseData.status}
              onValueChange={(value) => handleDropdownSave('status', value)}
            >
              <SelectTrigger className="h-8 w-full text-sm">
                <div className="flex items-center gap-2">
                  <div className={`h-2.5 w-2.5 rounded-full ${getStatusDotColor(caseData.status)}`} />
                  <span>{caseData.status}</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OPEN">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                    <span>OPEN</span>
                  </div>
                </SelectItem>
                <SelectItem value="AWAITING">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                    <span>AWAITING</span>
                  </div>
                </SelectItem>
                <SelectItem value="CLOSED">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                    <span>CLOSED</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action Required By */}
        <div className="grid grid-cols-3 gap-2">
          <Label className="text-sm font-semibold text-muted-foreground">Action Required By</Label>
          <div className="col-span-2">
            <Select
              value={caseData.actionRequiredBy || 'none'}
              onValueChange={(value) => handleDropdownSave('actionRequiredBy', value === 'none' ? null : value)}
            >
              <SelectTrigger className="h-8 w-full text-sm">
                <span className={`inline-flex items-center justify-center px-3 py-0.5 rounded text-xs font-medium w-[110px] ${getActionRequiredColor(caseData.actionRequiredBy)}`}>
                  {caseData.actionRequiredBy || '-'}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <span className="inline-flex items-center justify-center px-3 py-1 rounded text-xs font-medium w-[100px] bg-muted text-muted-foreground">
                    -
                  </span>
                </SelectItem>
                <SelectItem value="ARGAN">
                  <span className="inline-flex items-center justify-center px-3 py-1 rounded text-xs font-medium w-[100px] bg-green-100 text-green-700">
                    ARGAN
                  </span>
                </SelectItem>
                <SelectItem value="CLIENT">
                  <span className="inline-flex items-center justify-center px-3 py-1 rounded text-xs font-medium w-[100px] bg-gray-100 text-gray-700">
                    CLIENT
                  </span>
                </SelectItem>
                <SelectItem value="CONTRACTOR">
                  <span className="inline-flex items-center justify-center px-3 py-1 rounded text-xs font-medium w-[100px] bg-blue-100 text-blue-700">
                    CONTRACTOR
                  </span>
                </SelectItem>
                <SelectItem value="EMPLOYEE">
                  <span className="inline-flex items-center justify-center px-3 py-1 rounded text-xs font-medium w-[100px] bg-yellow-100 text-yellow-700">
                    EMPLOYEE
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action Required */}
        <div className="grid grid-cols-3 gap-2 items-center">
          <Label className="text-sm font-semibold text-muted-foreground">Action Required</Label>
          <div className="col-span-2">
            <Input
              value={actionRequiredText}
              onChange={(e) => setActionRequiredText(e.target.value)}
              onBlur={() => handleFieldSave('actionRequired', actionRequiredText)}
              className="h-8 text-sm"
              placeholder="What action is needed..."
            />
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
            onBlur={() => handleFieldSave('description', description)}
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
