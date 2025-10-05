import { ContactType } from '@prisma/client';
import { Building2, Mail, BadgePoundSterling, SquarePen, ShieldCheck } from 'lucide-react';

import { ContactTabButtons, ContactDisplay } from '@/components/clients/contact-tabs';
import { ContactTabsProvider } from '@/components/clients/contact-tabs-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Contact {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string | null;
  type: ContactType;
}

interface Audit {
  id: number;
  auditedBy: string;
  interval: string;
  nextAuditDate: string;
}

interface Client {
  id: number;
  companyName: string;
  businessId: string | null;
  sector: string | null;
  serviceTier: string;
  monthlyRetainer: number | null;
  status: string;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  postcode: string | null;
  country: string | null;
  externalAudit: boolean;
  contacts: Contact[];
  audits: Audit[];
}

interface ClientInfoContentProps {
  client: Client;
  getServiceTierLabel: (tier: string) => string;
}

// Helper function for audit interval labels (presentation logic)
const getAuditIntervalLabel = (interval: string): string => {
  switch (interval) {
    case 'QUARTERLY':
      return 'Quarterly';
    case 'ANNUALLY':
      return 'Annually';
    case 'TWO_YEARS':
      return 'Every 2 Years';
    case 'THREE_YEARS':
      return 'Every 3 Years';
    case 'FIVE_YEARS':
      return 'Every 5 Years';
    default:
      return interval;
  }
};

// Helper function for date formatting (presentation logic)
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

export function ClientInfoContent({ client, getServiceTierLabel }: ClientInfoContentProps) {
  return (
    <div className="space-y-4">
      {/* Company & Service Information - Side by Side */}
      <Card className="relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 h-8 w-8 hover:text-green-600 transition-colors"
          disabled
        >
          <SquarePen className="h-4 w-4" />
        </Button>
        <CardContent className="pt-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Company Information */}
            <div>
              <CardTitle className="flex items-center gap-2 mb-4">
                <Building2 className="h-5 w-5" />
                Company Information
              </CardTitle>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Company Name</p>
                  <p className="text-lg">{client.companyName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Business ID</p>
                  <p className="text-lg">{client.businessId || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sector</p>
                  <p className="text-lg">{client.sector || '-'}</p>
                </div>
              </div>
            </div>

            {/* Service Information */}
            <div>
              <CardTitle className="flex items-center gap-2 mb-4">
                <BadgePoundSterling className="h-5 w-5" />
                Service Information
              </CardTitle>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Service Tier</p>
                  <p className="text-lg">{getServiceTierLabel(client.serviceTier)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Monthly Retainer</p>
                  <p className="text-lg">
                    {client.monthlyRetainer
                      ? `£${Number(client.monthlyRetainer).toFixed(2)}`
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <p className="text-lg">{client.status.charAt(0) + client.status.slice(1).toLowerCase()}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information - Full Width */}
      <ContactTabsProvider>
        <Card className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 h-8 w-8 hover:text-green-600 transition-colors z-10"
            disabled
          >
            <SquarePen className="h-4 w-4" />
          </Button>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Contact Information
              </CardTitle>
              <ContactTabButtons contacts={client.contacts} />
            </div>
          </CardHeader>
          <CardContent>
            <ContactDisplay contacts={client.contacts} />
          </CardContent>
        </Card>
      </ContactTabsProvider>

      {/* Address - Full Width */}
      <Card className="relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 h-8 w-8 hover:text-green-600 transition-colors"
          disabled
        >
          <SquarePen className="h-4 w-4" />
        </Button>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Address
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Address Line 1</p>
              <p className="text-lg">{client.addressLine1 || '-'}</p>
            </div>
            {client.addressLine2 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Address Line 2</p>
                <p className="text-lg">{client.addressLine2}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground">City</p>
              <p className="text-lg">{client.city || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Postcode</p>
              <p className="text-lg">{client.postcode || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Country</p>
              <p className="text-lg">{client.country || '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* External Auditing - Full Width */}
      <Card className="relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 h-8 w-8 hover:text-green-600 transition-colors"
          disabled
        >
          <SquarePen className="h-4 w-4" />
        </Button>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            External Auditing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* External Audit Status */}
            <div>
              <p className="text-sm font-medium text-muted-foreground">External Audit</p>
              <p className="text-lg">{client.externalAudit ? 'Yes' : 'No'}</p>
            </div>

            {/* Show audit details if externally audited */}
            {client.externalAudit && (
              <>
                {client.audits.length > 0 ? (
                  <div className="space-y-4">
                    <p className="text-sm font-semibold text-muted-foreground">Audit Details</p>
                    {client.audits.map((audit) => (
                      <div
                        key={audit.id}
                        className="border rounded-lg p-4 bg-muted/50"
                      >
                        <div className="grid gap-4 md:grid-cols-3">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Audited By</p>
                            <p className="text-lg mt-1">{audit.auditedBy}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Audit Interval</p>
                            <p className="text-lg mt-1">{getAuditIntervalLabel(audit.interval)}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Next Audit Date</p>
                            <p className="text-lg mt-1">{formatDate(audit.nextAuditDate)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground py-2">
                    No audit records found. Please add audit details.
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
