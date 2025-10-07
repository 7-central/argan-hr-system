'use client';

import { ContactType } from '@prisma/client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useContactTabs } from './contact-tabs-provider';

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
}

// Helper to get tab label
const getTabLabel = (type: ContactType): string => {
  switch (type) {
    case 'PRIMARY':
      return 'Primary';
    case 'SECONDARY':
      return 'Secondary';
    case 'INVOICE':
      return 'Invoice';
  }
};

// Export buttons component separately
export function ContactTabButtons({ contacts }: ContactTabButtonsProps) {
  const { activeTab, setActiveTab } = useContactTabs();

  return (
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ContactType)}>
      <TabsList className="grid w-full grid-cols-3">
        {(['PRIMARY', 'SECONDARY', 'INVOICE'] as ContactType[]).map((type) => {
          const hasContact = contacts.some((c) => c.type === type);

          return (
            <TabsTrigger
              key={type}
              value={type}
              disabled={!hasContact}
              className="data-[state=active]:text-primary"
            >
              {getTabLabel(type)}
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}

// Export contact display component separately
export function ContactDisplay({ contacts, editMode = false, onContactChange }: ContactDisplayProps) {
  const { activeTab } = useContactTabs();
  const activeContact = contacts.find((c) => c.type === activeTab);

  if (!activeContact) {
    return (
      <div className="text-muted-foreground text-sm py-4">
        No {getTabLabel(activeTab).toLowerCase()} contact configured
      </div>
    );
  }

  if (editMode) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {/* Contact Name */}
        <div className="space-y-2">
          <Label htmlFor={`contact-name-${activeContact.id}`} className="text-sm font-medium text-muted-foreground">
            Contact Name
          </Label>
          <Input
            id={`contact-name-${activeContact.id}`}
            value={activeContact.name}
            onChange={(e) => onContactChange?.(activeContact.id, 'name', e.target.value)}
            className="w-full"
          />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor={`contact-email-${activeContact.id}`} className="text-sm font-medium text-muted-foreground">
            Email
          </Label>
          <Input
            id={`contact-email-${activeContact.id}`}
            type="email"
            value={activeContact.email}
            onChange={(e) => onContactChange?.(activeContact.id, 'email', e.target.value)}
            className="w-full"
          />
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor={`contact-phone-${activeContact.id}`} className="text-sm font-medium text-muted-foreground">
            Phone
          </Label>
          <Input
            id={`contact-phone-${activeContact.id}`}
            type="tel"
            value={activeContact.phone || ''}
            onChange={(e) => onContactChange?.(activeContact.id, 'phone', e.target.value)}
            className="w-full"
          />
        </div>

        {/* Role */}
        <div className="space-y-2">
          <Label htmlFor={`contact-role-${activeContact.id}`} className="text-sm font-medium text-muted-foreground">
            Role
          </Label>
          <Input
            id={`contact-role-${activeContact.id}`}
            value={activeContact.role || ''}
            onChange={(e) => onContactChange?.(activeContact.id, 'role', e.target.value)}
            className="w-full"
          />
        </div>
      </div>
    );
  }

  // View mode
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Contact Name */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Contact Name</p>
        <p className="text-base">{activeContact.name}</p>
      </div>

      {/* Email */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Email</p>
        <a
          href={`mailto:${activeContact.email}`}
          className="text-base text-primary hover:underline block"
        >
          {activeContact.email}
        </a>
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Phone</p>
        {activeContact.phone ? (
          <a
            href={`tel:${activeContact.phone}`}
            className="text-base text-primary hover:underline block"
          >
            {activeContact.phone}
          </a>
        ) : (
          <p className="text-base text-muted-foreground">-</p>
        )}
      </div>

      {/* Role */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Role</p>
        <p className="text-base">{activeContact.role || '-'}</p>
      </div>
    </div>
  );
}

