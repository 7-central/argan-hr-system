'use client';

import { useState } from 'react';

import { ContactType } from '@prisma/client';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { createContact } from '@/lib/actions/contact.actions';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Contact = {
  id: number;
  type: ContactType;
  name: string;
  email: string;
  phone: string | null;
  role: string | null;
};

interface ContactTabButtonsProps {
  contacts: Contact[];
}

interface ContactDisplayProps {
  contacts: Contact[];
  editMode?: boolean;
  onContactChange?: (contactId: number, field: string, value: string) => void;
  clientId?: number;
  onContactAdded?: (newContact: Contact) => void;
  onContactDelete?: (contactId: number) => void;
}

// Empty component - no longer needed but kept for compatibility
export function ContactTabButtons({ contacts: _contacts }: ContactTabButtonsProps) {
  return null;
}

// Export contact display component with accordion layout
export function ContactDisplay({ contacts, editMode = false, onContactChange, clientId, onContactAdded, onContactDelete }: ContactDisplayProps) {
  const [openContactAccordion, setOpenContactAccordion] = useState<string[]>([]);
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newContact, setNewContact] = useState({
    type: 'SERVICE' as ContactType,
    name: '',
    email: '',
    phone: '',
    role: '',
  });

  const handleSaveNewContact = async () => {
    // Validate required fields
    if (!newContact.name || !newContact.email) {
      toast.error('Name and email are required');
      return;
    }

    if (!clientId) {
      toast.error('Client ID is missing');
      return;
    }

    setIsSaving(true);

    try {
      const result = await createContact(clientId, {
        type: newContact.type,
        name: newContact.name,
        email: newContact.email,
        phone: newContact.phone || undefined,
        role: newContact.role || undefined,
      });

      if (result.success && result.contact) {
        toast.success('Contact created successfully');
        setIsAddingContact(false);
        setNewContact({
          type: 'SERVICE',
          name: '',
          email: '',
          phone: '',
          role: '',
        });
        onContactAdded?.(result.contact);
      } else {
        toast.error(result.error || 'Failed to create contact');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (contacts.length === 0 && !isAddingContact) {
    return (
      <div className="space-y-4">
        <div className="text-muted-foreground text-sm py-4">
          No contacts configured
        </div>
        {editMode && clientId && (
          <button
            type="button"
            onClick={() => setIsAddingContact(true)}
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-primary/50 text-primary hover:border-primary hover:bg-primary/5 cursor-pointer transition-all duration-200"
          >
            <Plus className="h-5 w-5" />
            <span className="font-medium">Create New Contact</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Accordion
        type="multiple"
        className="w-full"
        value={openContactAccordion}
        onValueChange={setOpenContactAccordion}
      >
        {contacts.map((contact, index) => (
          <AccordionItem key={contact.id} value={`contact-${contact.id}`}>
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-4 w-full pr-4 text-left text-sm">
                <div className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-white border-2 border-primary text-primary font-semibold text-sm">
                  {index + 1}
                </div>
                <span className="flex-1">
                  <span className="text-muted-foreground">Contact Type:</span>{' '}
                  <span className="font-medium">{contact.type === 'SERVICE' ? 'Service' : 'Invoice'}</span>
                </span>
                <span className="flex-1">
                  <span className="text-muted-foreground">Contact Name:</span>{' '}
                  <span className="font-medium">{contact.name || `Contact ${index + 1}`}</span>
                </span>
                <span className="flex-1">
                  {contact.role ? (
                    <>
                      <span className="text-muted-foreground">Contact Role:</span>{' '}
                      <span className="font-medium">{contact.role}</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">No role specified</span>
                  )}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-4">
                {editMode ? (
                  <>
                    {/* Contact Type and Delete Button Row */}
                    <div className="flex gap-2">
                      <div className="space-y-2 flex-1">
                        <Label htmlFor={`contact-type-${contact.id}`}>
                          Contact Type <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={contact.type}
                          onValueChange={(value) => onContactChange?.(contact.id, 'type', value)}
                        >
                          <SelectTrigger id={`contact-type-${contact.id}`}>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SERVICE">Service Contact</SelectItem>
                            <SelectItem value="INVOICE">Invoice Contact</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="invisible">Delete</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => onContactDelete?.(contact.id)}
                          className="h-10 w-10 text-red-500 hover:text-red-700 hover:bg-red-50"
                          title="Delete contact"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Name and Email */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`contact-name-${contact.id}`}>
                          Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id={`contact-name-${contact.id}`}
                          value={contact.name}
                          onChange={(e) => onContactChange?.(contact.id, 'name', e.target.value)}
                          placeholder="Enter contact name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`contact-email-${contact.id}`}>
                          Email <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id={`contact-email-${contact.id}`}
                          type="email"
                          value={contact.email}
                          onChange={(e) => onContactChange?.(contact.id, 'email', e.target.value)}
                          placeholder="contact@company.com"
                        />
                      </div>
                    </div>

                    {/* Phone and Role */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`contact-phone-${contact.id}`}>Phone</Label>
                        <Input
                          id={`contact-phone-${contact.id}`}
                          type="tel"
                          value={contact.phone || ''}
                          onChange={(e) => onContactChange?.(contact.id, 'phone', e.target.value)}
                          placeholder="+44 20 1234 5678"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`contact-role-${contact.id}`}>Role</Label>
                        <Input
                          id={`contact-role-${contact.id}`}
                          value={contact.role || ''}
                          onChange={(e) => onContactChange?.(contact.id, 'role', e.target.value)}
                          placeholder="e.g., HR Manager"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* View Mode */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Contact Type</p>
                        <p className="text-base">{contact.type === 'SERVICE' ? 'Service Contact' : 'Invoice Contact'}</p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Contact Name</p>
                        <p className="text-base">{contact.name}</p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Email</p>
                        <a
                          href={`mailto:${contact.email}`}
                          className="text-base text-primary hover:underline block"
                        >
                          {contact.email}
                        </a>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Phone</p>
                        {contact.phone ? (
                          <a
                            href={`tel:${contact.phone}`}
                            className="text-base text-primary hover:underline block"
                          >
                            {contact.phone}
                          </a>
                        ) : (
                          <p className="text-base text-muted-foreground">-</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Role</p>
                        <p className="text-base">{contact.role || '-'}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* New Contact Form (in edit mode) */}
      {editMode && isAddingContact && clientId && (
        <div className="space-y-4 p-4 border border-primary/20 rounded-lg bg-primary/5">
          {/* Contact Type */}
          <div className="space-y-2">
            <Label htmlFor="new-contact-type">
              Contact Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={newContact.type}
              onValueChange={(value) => setNewContact({ ...newContact, type: value as ContactType })}
              disabled={isSaving}
            >
              <SelectTrigger id="new-contact-type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SERVICE">Service Contact</SelectItem>
                <SelectItem value="INVOICE">Invoice Contact</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Name and Email */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new-contact-name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="new-contact-name"
                value={newContact.name}
                onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                disabled={isSaving}
                placeholder="Enter contact name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-contact-email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="new-contact-email"
                type="email"
                value={newContact.email}
                onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                disabled={isSaving}
                placeholder="contact@company.com"
              />
            </div>
          </div>

          {/* Phone and Role */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new-contact-phone">Phone</Label>
              <Input
                id="new-contact-phone"
                type="tel"
                value={newContact.phone}
                onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                disabled={isSaving}
                placeholder="+44 20 1234 5678"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-contact-role">Role</Label>
              <Input
                id="new-contact-role"
                value={newContact.role}
                onChange={(e) => setNewContact({ ...newContact, role: e.target.value })}
                disabled={isSaving}
                placeholder="e.g., HR Manager"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t border-primary/20">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsAddingContact(false);
                setNewContact({
                  type: 'SERVICE',
                  name: '',
                  email: '',
                  phone: '',
                  role: '',
                });
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveNewContact}
              disabled={isSaving}
              className="min-w-[150px]"
            >
              {isSaving ? 'Saving...' : 'Save Contact'}
            </Button>
          </div>
        </div>
      )}

      {/* Create New Contact Button */}
      {editMode && !isAddingContact && clientId && (
        <button
          type="button"
          onClick={() => setIsAddingContact(true)}
          disabled={isSaving}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-primary/50 text-primary hover:border-primary hover:bg-primary/5 cursor-pointer transition-all duration-200"
        >
          <Plus className="h-5 w-5" />
          <span className="font-medium">Create New Contact</span>
        </button>
      )}
    </div>
  );
}

