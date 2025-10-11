'use client';

import { useState, useEffect } from 'react';

import { Plus, Check, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import { getUniqueSectors, updateSector, deleteSector } from '@/app/admin/(protected)/clients/actions';

interface SectorSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

/**
 * Dynamic Sector Select Component
 * Populates from unique sectors in the database
 *
 * Features:
 * - Fetches unique sectors from Client table on mount
 * - Searchable dropdown with existing sectors
 * - "Add New" button to enter free text for new sectors
 * - Edit existing sectors (updates all clients using that sector)
 * - Delete sectors (removes from all clients using it)
 * - Self-populating and self-maintaining
 */
export function SectorSelect({ value, onChange, disabled = false }: SectorSelectProps) {
  const [open, setOpen] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showEditValueDialog, setShowEditValueDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [newSector, setNewSector] = useState('');
  const [editingSector, setEditingSector] = useState('');
  const [editedSectorName, setEditedSectorName] = useState('');
  const [editingValue, setEditingValue] = useState('');
  const [deletingSector, setDeletingSector] = useState('');
  const [sectors, setSectors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch unique sectors from database on mount
  useEffect(() => {
    async function loadSectors() {
      setLoading(true);
      const uniqueSectors = await getUniqueSectors();
      setSectors(uniqueSectors);
      setLoading(false);
    }
    loadSectors();
  }, []);

  /**
   * Reload sectors from database
   */
  const reloadSectors = async () => {
    const uniqueSectors = await getUniqueSectors();
    setSectors(uniqueSectors);
  };

  /**
   * Handle adding a new custom sector
   * Just sets the value - it will be added to the database when the form is saved
   */
  const handleAddSector = () => {
    if (newSector.trim()) {
      const trimmedSector = newSector.trim();
      onChange(trimmedSector);
      setNewSector('');
      setShowAddDialog(false);
      setOpen(false);
    }
  };

  /**
   * Handle editing an existing sector
   * Updates all clients using this sector
   */
  const handleEditSector = async () => {
    if (!editedSectorName.trim() || !editingSector) return;

    setIsProcessing(true);
    try {
      const result = await updateSector(editingSector, editedSectorName.trim());

      if (result.success) {
        toast.success(`Sector updated`, {
          description: `Updated "${editingSector}" to "${editedSectorName.trim()}" for ${result.data?.count || 0} client(s)`,
        });

        // Update the selected value if it was the one being edited
        if (value === editingSector) {
          onChange(editedSectorName.trim());
        }

        // Reload sectors to reflect the change
        await reloadSectors();

        setShowEditDialog(false);
        setEditingSector('');
        setEditedSectorName('');
      } else {
        toast.error('Failed to update sector', {
          description: result.error || 'An unexpected error occurred',
        });
      }
    } catch (error) {
      toast.error('Failed to update sector', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handle deleting a sector
   * Sets to null for all clients using it
   */
  const handleDeleteSector = async () => {
    if (!deletingSector) return;

    setIsProcessing(true);
    try {
      const result = await deleteSector(deletingSector);

      if (result.success) {
        if (result.data?.deleted) {
          toast.success(`Sector deleted`, {
            description: `Removed "${deletingSector}" from ${result.data.count} client(s)`,
          });

          // Clear the selected value if it was the one being deleted
          if (value === deletingSector) {
            onChange('');
          }

          // Reload sectors to reflect the change
          await reloadSectors();
        } else {
          toast.info('No clients found', {
            description: `No clients are using the sector "${deletingSector}"`,
          });
        }

        setShowDeleteDialog(false);
        setDeletingSector('');
      } else {
        toast.error('Failed to delete sector', {
          description: result.error || 'An unexpected error occurred',
        });
      }
    } catch (error) {
      toast.error('Failed to delete sector', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handle editing the current field value
   * Just updates the form field value - doesn't touch the database
   */
  const handleEditValue = () => {
    if (editingValue.trim()) {
      onChange(editingValue.trim());
      setShowEditValueDialog(false);
      setEditingValue('');
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
            disabled={disabled}
          >
            <span className="truncate">{value || 'Select sector...'}</span>
            <div className="flex items-center gap-1 ml-2 shrink-0">
              {value && !disabled && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingValue(value);
                    setShowEditValueDialog(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      setEditingValue(value);
                      setShowEditValueDialog(true);
                    }
                  }}
                  className="p-0.5 hover:bg-accent rounded transition-colors cursor-pointer"
                  title="Edit sector value"
                >
                  <Pencil className="h-3.5 w-3.5 text-blue-600" />
                </span>
              )}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 opacity-50"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0">
          <Command>
            <CommandInput placeholder="Search sectors..." />
            <CommandList>
              <CommandEmpty>
                {loading ? (
                  'Loading sectors...'
                ) : (
                  <>
                    No sector found.
                    <Button
                      variant="link"
                      className="text-sm"
                      onClick={() => {
                        setShowAddDialog(true);
                        setOpen(false);
                      }}
                    >
                      Add new sector
                    </Button>
                  </>
                )}
              </CommandEmpty>
              <CommandGroup>
                {sectors.map((sector) => (
                  <CommandItem
                    key={sector}
                    value={sector}
                    onSelect={(currentValue) => {
                      onChange(currentValue === value ? '' : currentValue);
                      setOpen(false);
                    }}
                    className="group"
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${value === sector ? 'opacity-100' : 'opacity-0'}`}
                    />
                    <span className="flex-1">{sector}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingSector(sector);
                          setEditedSectorName(sector);
                          setShowEditDialog(true);
                          setOpen(false);
                        }}
                        className="p-1 hover:bg-muted rounded"
                        title="Edit sector"
                      >
                        <Pencil className="h-3 w-3 text-blue-600" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingSector(sector);
                          setShowDeleteDialog(true);
                          setOpen(false);
                        }}
                        className="p-1 hover:bg-muted rounded"
                        title="Delete sector"
                      >
                        <Trash2 className="h-3 w-3 text-red-600" />
                      </button>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
              <div className="border-t p-2">
                <Button
                  variant="outline"
                  className="w-full justify-start text-sm"
                  onClick={() => {
                    setShowAddDialog(true);
                    setOpen(false);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Sector
                </Button>
              </div>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Add New Sector Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Sector</DialogTitle>
            <DialogDescription>
              Enter a new sector name. It will be saved to the database when you create the client
              and will appear in this dropdown for future use.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newSector">Sector Name</Label>
              <Input
                id="newSector"
                placeholder="e.g., Agriculture, Energy, Media"
                value={newSector}
                onChange={(e) => setNewSector(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSector();
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSector} disabled={!newSector.trim()}>
              Add Sector
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Sector Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Sector</DialogTitle>
            <DialogDescription>
              Rename this sector. All clients using &quot;{editingSector}&quot; will be updated to use the new name.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editSector">Sector Name</Label>
              <Input
                id="editSector"
                placeholder="Enter new sector name"
                value={editedSectorName}
                onChange={(e) => setEditedSectorName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleEditSector();
                  }
                }}
                autoFocus
                disabled={isProcessing}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false);
                setEditingSector('');
                setEditedSectorName('');
              }}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSector}
              disabled={!editedSectorName.trim() || isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Sector'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Sector Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Sector?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove &quot;{deletingSector}&quot; from all clients currently using it.
              The clients will have their sector field cleared (set to blank).
              <br />
              <br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowDeleteDialog(false);
                setDeletingSector('');
              }}
              disabled={isProcessing}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteSector();
              }}
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Sector'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Current Value Dialog */}
      <Dialog open={showEditValueDialog} onOpenChange={setShowEditValueDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Sector</DialogTitle>
            <DialogDescription>
              Change the sector value. This only updates the form field and won&apos;t affect any saved clients.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editValue">Sector Name</Label>
              <Input
                id="editValue"
                placeholder="Enter sector name"
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleEditValue();
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditValueDialog(false);
                setEditingValue('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleEditValue} disabled={!editingValue.trim()}>
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
