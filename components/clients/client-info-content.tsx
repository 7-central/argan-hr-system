import { ContactType } from '@prisma/client';
import { Building2, Mail, BadgePoundSterling, SquarePen } from 'lucide-react';

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
  contacts: Contact[];
}

interface ClientInfoContentProps {
  client: Client;
  getServiceTierLabel: (tier: string) => string;
}

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
                {client.businessId && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Business ID</p>
                    <p className="text-lg">{client.businessId}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sector</p>
                  <p className="text-lg">{client.sector || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <p className="text-lg">{client.status.charAt(0) + client.status.slice(1).toLowerCase()}</p>
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
    </div>
  );
}
