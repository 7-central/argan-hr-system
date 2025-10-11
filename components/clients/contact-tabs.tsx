'use client';

import { useState } from 'react';

import { ContactType, AddressType } from '@prisma/client';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { createAddress } from '@/lib/actions/address.actions';
import { createContact } from '@/lib/actions/contact.actions';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
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
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsAddingContact(true)}
            disabled={isSaving}
            className="text-primary hover:text-primary hover:bg-primary/10"
          >
            <Plus className="h-5 w-5" />
          </Button>
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
                <span className="w-28 flex-shrink-0">
                  <Badge
                    className={`w-20 ${
                      contact.type === 'SERVICE'
                        ? 'bg-green-800 text-white border-green-800'
                        : 'bg-white text-green-800 border-green-800'
                    }`}
                  >
                    {contact.type === 'SERVICE' ? 'Service' : 'Invoice'}
                  </Badge>
                </span>
                <span className="flex-1">
                  <span className="text-gray-500 font-semibold">Name:</span>{' '}
                  <span className="font-medium">{contact.name || `Contact ${index + 1}`}</span>
                </span>
                <span className="flex-1">
                  {contact.phone ? (
                    <>
                      <span className="text-gray-500 font-semibold">Tel:</span>{' '}
                      <span className="font-medium">{contact.phone}</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">No tel specified</span>
                  )}
                </span>
                <span className="flex-1">
                  {contact.email ? (
                    <>
                      <span className="text-gray-500 font-semibold">Email:</span>{' '}
                      <span className="font-medium">{contact.email}</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">No email specified</span>
                  )}
                </span>
                <span className="flex-1">
                  {contact.role ? (
                    <>
                      <span className="text-gray-500 font-semibold">Role:</span>{' '}
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
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setIsAddingContact(true)}
          disabled={isSaving}
          className="text-primary hover:text-primary hover:bg-primary/10"
        >
          <Plus className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}

// Address types
type Address = {
  id: number;
  type: AddressType;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  postcode: string;
  country: string;
};

interface AddressDisplayProps {
  addresses: Address[];
  editMode?: boolean;
  onAddressChange?: (addressId: number, field: string, value: string) => void;
  clientId?: number;
  onAddressAdded?: (newAddress: Address) => void;
  onAddressDelete?: (addressId: number) => void;
}

// Export address display component with accordion layout
export function AddressDisplay({ addresses, editMode = false, onAddressChange, clientId, onAddressAdded, onAddressDelete }: AddressDisplayProps) {
  const [openAddressAccordion, setOpenAddressAccordion] = useState<string[]>([]);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newAddress, setNewAddress] = useState({
    type: 'SERVICE' as AddressType,
    addressLine1: '',
    addressLine2: '',
    city: '',
    postcode: '',
    country: 'United Kingdom',
  });

  const handleSaveNewAddress = async () => {
    // Validate required fields
    if (!newAddress.addressLine1 || !newAddress.city || !newAddress.postcode) {
      toast.error('Address Line 1, city, and postcode are required');
      return;
    }

    if (!clientId) {
      toast.error('Client ID is missing');
      return;
    }

    setIsSaving(true);

    try {
      const result = await createAddress(clientId, {
        type: newAddress.type,
        addressLine1: newAddress.addressLine1,
        addressLine2: newAddress.addressLine2 || undefined,
        city: newAddress.city,
        postcode: newAddress.postcode,
        country: newAddress.country || 'United Kingdom',
      });

      if (result.success && result.address) {
        toast.success('Address created successfully');
        setIsAddingAddress(false);
        setNewAddress({
          type: 'SERVICE',
          addressLine1: '',
          addressLine2: '',
          city: '',
          postcode: '',
          country: 'United Kingdom',
        });
        onAddressAdded?.(result.address);
      } else {
        toast.error(result.error || 'Failed to create address');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (addresses.length === 0 && !isAddingAddress) {
    return (
      <div className="space-y-4">
        <div className="text-muted-foreground text-sm py-4">
          No addresses configured
        </div>
        {editMode && clientId && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsAddingAddress(true)}
            disabled={isSaving}
            className="text-primary hover:text-primary hover:bg-primary/10"
          >
            <Plus className="h-5 w-5" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Accordion
        type="multiple"
        className="w-full"
        value={openAddressAccordion}
        onValueChange={setOpenAddressAccordion}
      >
        {addresses.map((address, index) => (
          <AccordionItem key={address.id} value={`address-${address.id}`}>
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-4 w-full pr-4 text-left text-sm">
                <span className="w-28 flex-shrink-0">
                  <Badge
                    className={`w-20 ${
                      address.type === 'SERVICE'
                        ? 'bg-green-800 text-white border-green-800'
                        : 'bg-white text-green-800 border-green-800'
                    }`}
                  >
                    {address.type === 'SERVICE' ? 'Service' : 'Invoice'}
                  </Badge>
                </span>
                <span className="flex-1">
                  <span className="text-gray-500 font-semibold">Address:</span>{' '}
                  <span className="font-medium">
                    {[
                      address.addressLine1,
                      address.addressLine2,
                      address.city,
                      address.postcode,
                      address.country
                    ].filter(Boolean).join(', ') || `Address ${index + 1}`}
                  </span>
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-4">
                {editMode ? (
                  <>
                    {/* Address Type and Delete Button Row */}
                    <div className="flex gap-2">
                      <div className="space-y-2 flex-1">
                        <Label htmlFor={`address-type-${address.id}`}>
                          Address Type <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={address.type}
                          onValueChange={(value) => onAddressChange?.(address.id, 'type', value)}
                        >
                          <SelectTrigger id={`address-type-${address.id}`}>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SERVICE">Service Address</SelectItem>
                            <SelectItem value="INVOICE">Invoice Address</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="invisible">Delete</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => onAddressDelete?.(address.id)}
                          className="h-10 w-10 text-red-500 hover:text-red-700 hover:bg-red-50"
                          title="Delete address"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Address Line 1 and 2 */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`address-line1-${address.id}`}>
                          Address Line 1 <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id={`address-line1-${address.id}`}
                          value={address.addressLine1}
                          onChange={(e) => onAddressChange?.(address.id, 'addressLine1', e.target.value)}
                          placeholder="Street address"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`address-line2-${address.id}`}>Address Line 2</Label>
                        <Input
                          id={`address-line2-${address.id}`}
                          value={address.addressLine2 || ''}
                          onChange={(e) => onAddressChange?.(address.id, 'addressLine2', e.target.value)}
                          placeholder="Apartment, suite, etc."
                        />
                      </div>
                    </div>

                    {/* City and Postcode */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`address-city-${address.id}`}>
                          City <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id={`address-city-${address.id}`}
                          value={address.city}
                          onChange={(e) => onAddressChange?.(address.id, 'city', e.target.value)}
                          placeholder="City"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`address-postcode-${address.id}`}>
                          Postcode <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id={`address-postcode-${address.id}`}
                          value={address.postcode}
                          onChange={(e) => onAddressChange?.(address.id, 'postcode', e.target.value)}
                          placeholder="Postcode"
                        />
                      </div>
                    </div>

                    {/* Country */}
                    <div className="space-y-2">
                      <Label htmlFor={`address-country-${address.id}`}>
                        Country <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id={`address-country-${address.id}`}
                        value={address.country}
                        onChange={(e) => onAddressChange?.(address.id, 'country', e.target.value)}
                        placeholder="United Kingdom"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {/* View Mode */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Address Type</p>
                        <p className="text-base">{address.type === 'SERVICE' ? 'Service Address' : 'Invoice Address'}</p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Address Line 1</p>
                        <p className="text-base">{address.addressLine1}</p>
                      </div>

                      {address.addressLine2 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">Address Line 2</p>
                          <p className="text-base">{address.addressLine2}</p>
                        </div>
                      )}

                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">City</p>
                        <p className="text-base">{address.city}</p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Postcode</p>
                        <p className="text-base">{address.postcode}</p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Country</p>
                        <p className="text-base">{address.country}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* New Address Form (in edit mode) */}
      {editMode && isAddingAddress && clientId && (
        <div className="space-y-4 p-4 border border-primary/20 rounded-lg bg-primary/5">
          {/* Address Type */}
          <div className="space-y-2">
            <Label htmlFor="new-address-type">
              Address Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={newAddress.type}
              onValueChange={(value) => setNewAddress({ ...newAddress, type: value as AddressType })}
              disabled={isSaving}
            >
              <SelectTrigger id="new-address-type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SERVICE">Service Address</SelectItem>
                <SelectItem value="INVOICE">Invoice Address</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Address Line 1 and 2 */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new-address-line1">
                Address Line 1 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="new-address-line1"
                value={newAddress.addressLine1}
                onChange={(e) => setNewAddress({ ...newAddress, addressLine1: e.target.value })}
                disabled={isSaving}
                placeholder="Street address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-address-line2">Address Line 2</Label>
              <Input
                id="new-address-line2"
                value={newAddress.addressLine2}
                onChange={(e) => setNewAddress({ ...newAddress, addressLine2: e.target.value })}
                disabled={isSaving}
                placeholder="Apartment, suite, etc."
              />
            </div>
          </div>

          {/* City and Postcode */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new-address-city">
                City <span className="text-red-500">*</span>
              </Label>
              <Input
                id="new-address-city"
                value={newAddress.city}
                onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                disabled={isSaving}
                placeholder="City"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-address-postcode">
                Postcode <span className="text-red-500">*</span>
              </Label>
              <Input
                id="new-address-postcode"
                value={newAddress.postcode}
                onChange={(e) => setNewAddress({ ...newAddress, postcode: e.target.value })}
                disabled={isSaving}
                placeholder="Postcode"
              />
            </div>
          </div>

          {/* Country */}
          <div className="space-y-2">
            <Label htmlFor="new-address-country">
              Country <span className="text-red-500">*</span>
            </Label>
            <Input
              id="new-address-country"
              value={newAddress.country}
              onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
              disabled={isSaving}
              placeholder="United Kingdom"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t border-primary/20">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsAddingAddress(false);
                setNewAddress({
                  type: 'SERVICE',
                  addressLine1: '',
                  addressLine2: '',
                  city: '',
                  postcode: '',
                  country: 'United Kingdom',
                });
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveNewAddress}
              disabled={isSaving}
              className="min-w-[150px]"
            >
              {isSaving ? 'Saving...' : 'Save Address'}
            </Button>
          </div>
        </div>
      )}

      {/* Create New Address Button */}
      {editMode && !isAddingAddress && clientId && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setIsAddingAddress(true)}
          disabled={isSaving}
          className="text-primary hover:text-primary hover:bg-primary/10"
        >
          <Plus className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}

