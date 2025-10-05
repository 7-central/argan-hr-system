'use client';

import { useState, useEffect } from 'react';

import { Plus, Check } from 'lucide-react';


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

import { getUniqueSectors } from '@/app/admin/(protected)/clients/actions';

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
 * - New sectors appear in dropdown once saved to database
 * - Self-populating and self-maintaining
 */
export function SectorSelect({ value, onChange, disabled = false }: SectorSelectProps) {
  const [open, setOpen] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newSector, setNewSector] = useState('');
  const [sectors, setSectors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

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
            {value || 'Select sector...'}
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
              className="ml-2 h-4 w-4 shrink-0 opacity-50"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
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
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${value === sector ? 'opacity-100' : 'opacity-0'}`}
                    />
                    {sector}
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
    </>
  );
}
