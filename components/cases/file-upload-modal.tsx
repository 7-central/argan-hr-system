'use client';

import { useState } from 'react';

import { Upload, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';

interface FileUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseId: string;
  clientId: number;
  interactionId?: number | null;
  onUploadSuccess?: () => void;
}

/**
 * File Upload Modal
 * Handles file uploads to S3 with optional metadata
 */
export function FileUploadModal({
  open,
  onOpenChange,
  caseId,
  clientId,
  interactionId = null,
  onUploadSuccess,
}: FileUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileTitle, setFileTitle] = useState('');
  const [fileDescription, setFileDescription] = useState('');
  const [tags, setTags] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  /**
   * Handle file selection
   */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Auto-populate title with filename if empty
      if (!fileTitle) {
        setFileTitle(file.name.replace(/\.[^/.]+$/, '')); // Remove extension
      }
    }
  };

  /**
   * Handle file upload
   */
  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);

    try {
      // Parse tags
      const tagArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      // Get presigned URL from API
      const uploadPath = interactionId
        ? `${clientId}/cases/${caseId}/interactions/interaction-${interactionId}`
        : `${clientId}/cases/${caseId}/case-level`;

      const presignedResponse = await fetch('/api/cases/upload/presigned-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: selectedFile.name,
          fileType: selectedFile.type,
          uploadPath,
        }),
      });

      if (!presignedResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadUrl, fileUrl } = await presignedResponse.json();

      // Upload file to S3
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: selectedFile,
        headers: {
          'Content-Type': selectedFile.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      // Save file record to database
      const saveResponse = await fetch('/api/cases/upload/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId,
          interactionId,
          fileName: selectedFile.name,
          fileUrl,
          fileSize: selectedFile.size,
          fileTitle: fileTitle || null,
          fileDescription: fileDescription || null,
          fileTags: tagArray,
        }),
      });

      if (!saveResponse.ok) {
        throw new Error('Failed to save file record');
      }

      // Success!
      resetForm();
      onOpenChange(false);
      onUploadSuccess?.();
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Reset form
   */
  const resetForm = () => {
    setSelectedFile(null);
    setFileTitle('');
    setFileDescription('');
    setTags('');
  };

  /**
   * Handle dialog close
   */
  const handleClose = () => {
    if (!isUploading) {
      resetForm();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload File</DialogTitle>
          <DialogDescription>
            {interactionId
              ? `Upload file for interaction ${interactionId}`
              : 'Upload file for case'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File Selector */}
          <div className="space-y-2">
            <Label htmlFor="file">File *</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file"
                type="file"
                onChange={handleFileSelect}
                disabled={isUploading}
                className="cursor-pointer"
              />
              {selectedFile && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedFile(null)}
                  disabled={isUploading}
                  className="h-9 w-9"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {selectedFile && (
              <p className="text-xs text-muted-foreground">
                {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          {/* File Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title (optional)</Label>
            <Input
              id="title"
              placeholder="e.g., Written Warning - Sue Butterworth"
              value={fileTitle}
              onChange={(e) => setFileTitle(e.target.value)}
              disabled={isUploading}
            />
          </div>

          {/* File Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Brief description of this document..."
              value={fileDescription}
              onChange={(e) => setFileDescription(e.target.value)}
              disabled={isUploading}
              className="min-h-[80px] resize-none"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (optional)</Label>
            <Input
              id="tags"
              placeholder="e.g., Warning, Disciplinary, Final (comma separated)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              disabled={isUploading}
            />
            <p className="text-xs text-muted-foreground">
              Separate multiple tags with commas
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? (
              'Uploading...'
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
