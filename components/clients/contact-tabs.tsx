'use client';

import { ContactType } from '@prisma/client';
import { Mail, Phone, User, Briefcase } from 'lucide-react';

import { Button } from '@/components/ui/button';

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
    <div className="flex gap-2 mr-12">
      {(['PRIMARY', 'SECONDARY', 'INVOICE'] as ContactType[]).map((type) => {
        const hasContact = contacts.some((c) => c.type === type);
        const isActive = activeTab === type;

        return (
          <Button
            key={type}
            onClick={() => setActiveTab(type)}
            disabled={!hasContact}
            variant={isActive ? 'default' : 'outline'}
            className="w-28"
          >
            {getTabLabel(type)}
          </Button>
        );
      })}
    </div>
  );
}

// Export contact display component separately
export function ContactDisplay({ contacts }: ContactDisplayProps) {
  const { activeTab } = useContactTabs();
  const activeContact = contacts.find((c) => c.type === activeTab);

  return activeContact ? (
    <div className="grid gap-6 md:grid-cols-4">
      {/* Contact Name */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <User className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground">Contact Name</p>
        </div>
        <p className="text-lg">{activeContact.name}</p>
      </div>

      {/* Email */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground">Email</p>
        </div>
        <a
          href={`mailto:${activeContact.email}`}
          className="text-lg text-primary hover:underline"
        >
          {activeContact.email}
        </a>
      </div>

      {/* Phone */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground">Phone</p>
        </div>
        {activeContact.phone ? (
          <a
            href={`tel:${activeContact.phone}`}
            className="text-lg text-primary hover:underline"
          >
            {activeContact.phone}
          </a>
        ) : (
          <p className="text-lg text-muted-foreground">-</p>
        )}
      </div>

      {/* Role */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Briefcase className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground">Role</p>
        </div>
        <p className="text-lg">{activeContact.role || '-'}</p>
      </div>
    </div>
  ) : (
    <div className="text-muted-foreground text-sm py-4">
      No {getTabLabel(activeTab).toLowerCase()} contact configured
    </div>
  );
}

