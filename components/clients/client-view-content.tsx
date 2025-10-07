'use client';

import { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { ContactType } from '@prisma/client';
import {
  Building2,
  CheckCircle,
  CreditCard,
  FileText,
  Mail,
  Save,
  ShieldCheck,
  SquarePen,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { deleteAudit, updateAudit } from '@/lib/actions/audit.actions';
import { updateClient } from '@/lib/actions/client.actions';
import { updateContact } from '@/lib/actions/contact.actions';
import { updateContract } from '@/lib/actions/contract.actions';
import {
  AVAILABLE_SERVICES_IN_SCOPE,
  AVAILABLE_SERVICES_OUT_OF_SCOPE,
} from '@/lib/constants/contract';

import { ContactTabButtons, ContactDisplay } from '@/components/clients/contact-tabs';
import { ContactTabsProvider } from '@/components/clients/contact-tabs-provider';
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
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Contact {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string | null;
  type: ContactType;
}

interface Contract {
  id: number;
  version: number;
  contractStartDate: string;
  contractRenewalDate: string;
  status: string;
  hrAdminInclusiveHours: number | null;
  hrAdminInclusiveHoursPeriod: string | null;
  employmentLawInclusiveHours: number | null;
  employmentLawInclusiveHoursPeriod: string | null;
  inclusiveServicesInScope: string[];
  inclusiveServicesOutOfScope: string[];
  hrAdminRate: number | null;
  hrAdminRateUnit: string | null;
  hrAdminRateNotNeeded: boolean;
  employmentLawRate: number | null;
  employmentLawRateUnit: string | null;
  employmentLawRateNotNeeded: boolean;
  mileageRate: number | null;
  mileageRateNotNeeded: boolean;
  overnightRate: number | null;
  overnightRateNotNeeded: boolean;
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
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  postcode: string | null;
  country: string | null;
  contractStartDate: string | null;
  contractRenewalDate: string | null;
  status: string;
  welcomeEmailSent: boolean;
  paymentMethod: string | null;
  directDebitSetup: boolean | null;
  directDebitConfirmed: boolean | null;
  contractAddedToXero: boolean;
  recurringInvoiceSetup: boolean | null;
  dpaSignedGdpr: boolean;
  firstInvoiceSent: boolean;
  firstPaymentMade: boolean;
  lastPriceIncrease: string | null;
  externalAudit: boolean;
  contacts: Contact[];
  contracts: Contract[];
  audits: Audit[];
}

interface ClientViewContentProps {
  client: Client;
  editMode: boolean;
  initialTab?: string;
}

// Helper functions
const getServiceTierLabel = (tier: string): string => {
  switch (tier) {
    case 'TIER_1':
      return 'Tier 1 - Full Service';
    case 'DOC_ONLY':
      return 'Doc Only - Documentation';
    case 'AD_HOC':
      return 'Ad-hoc - As Needed';
    default:
      return tier;
  }
};

const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'ACTIVE':
      return 'Active';
    case 'INACTIVE':
      return 'Inactive';
    case 'PENDING':
      return 'Pending';
    default:
      return status;
  }
};

const formatDate = (date: string | null): string => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const formatAuditInterval = (interval: string): string => {
  // Convert from UPPERCASE_WITH_UNDERSCORES to Title Case With Spaces
  return interval
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const formatContractStatus = (status: string): string => {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};

const getContractStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'active':
      return 'bg-green-500';
    case 'draft':
      return 'bg-yellow-500';
    case 'archived':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

export function ClientViewContent({ client, editMode: initialEditMode, initialTab }: ClientViewContentProps) {
  const router = useRouter();
  const [editMode, setEditMode] = useState(initialEditMode);
  const [activeTab, setActiveTab] = useState(initialTab || 'company');
  const [isSaving, setIsSaving] = useState(false);

  // Get active contract
  const activeContract = client.contracts && client.contracts.length > 0
    ? client.contracts.find(c => c.status === 'ACTIVE') || client.contracts[0]
    : null;

  // Client state
  const [companyName, setCompanyName] = useState(client.companyName);
  const [businessId, setBusinessId] = useState(client.businessId || '');
  const [sector, setSector] = useState(client.sector || '');
  const [serviceTier, setServiceTier] = useState(client.serviceTier);
  const [monthlyRetainer, setMonthlyRetainer] = useState(
    client.monthlyRetainer ? client.monthlyRetainer.toString() : ''
  );
  const [status, setStatus] = useState(client.status);
  const [lastPriceIncrease, setLastPriceIncrease] = useState(
    client.lastPriceIncrease ? new Date(client.lastPriceIncrease).toISOString().split('T')[0] : ''
  );

  // Address state
  const [addressLine1, setAddressLine1] = useState(client.addressLine1 || '');
  const [addressLine2, setAddressLine2] = useState(client.addressLine2 || '');
  const [city, setCity] = useState(client.city || '');
  const [postcode, setPostcode] = useState(client.postcode || '');
  const [country, setCountry] = useState(client.country || '');

  // External audit state
  const [externalAudit, setExternalAudit] = useState(client.externalAudit);
  const [audits, setAudits] = useState(client.audits || []);

  // Contact state
  const [contacts, setContacts] = useState(client.contacts || []);

  // Contract state
  const [contractStartDate, setContractStartDate] = useState(
    activeContract?.contractStartDate ? new Date(activeContract.contractStartDate).toISOString().split('T')[0] : ''
  );
  const [contractRenewalDate, setContractRenewalDate] = useState(
    activeContract?.contractRenewalDate ? new Date(activeContract.contractRenewalDate).toISOString().split('T')[0] : ''
  );
  const [hrAdminInclusiveHours, setHrAdminInclusiveHours] = useState(
    activeContract?.hrAdminInclusiveHours ? activeContract.hrAdminInclusiveHours.toString() : ''
  );
  const [hrAdminInclusiveHoursPeriod, setHrAdminInclusiveHoursPeriod] = useState<'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | undefined>(
    (activeContract?.hrAdminInclusiveHoursPeriod as 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | null) || undefined
  );
  const [employmentLawInclusiveHours, setEmploymentLawInclusiveHours] = useState(
    activeContract?.employmentLawInclusiveHours ? activeContract.employmentLawInclusiveHours.toString() : ''
  );
  const [employmentLawInclusiveHoursPeriod, setEmploymentLawInclusiveHoursPeriod] = useState<'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | undefined>(
    (activeContract?.employmentLawInclusiveHoursPeriod as 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | null) || undefined
  );
  const [inclusiveServicesInScope, setInclusiveServicesInScope] = useState<string[]>(
    activeContract?.inclusiveServicesInScope || []
  );
  const [inclusiveServicesOutOfScope, setInclusiveServicesOutOfScope] = useState<string[]>(
    activeContract?.inclusiveServicesOutOfScope || []
  );
  const [hrAdminRate, setHrAdminRate] = useState(
    activeContract?.hrAdminRate ? activeContract.hrAdminRate.toString() : ''
  );
  const [hrAdminRateUnit, setHrAdminRateUnit] = useState<'HOURLY' | 'DAILY'>(
    (activeContract?.hrAdminRateUnit as 'HOURLY' | 'DAILY') || 'HOURLY'
  );
  const [employmentLawRate, setEmploymentLawRate] = useState(
    activeContract?.employmentLawRate ? activeContract.employmentLawRate.toString() : ''
  );
  const [employmentLawRateUnit, setEmploymentLawRateUnit] = useState<'HOURLY' | 'DAILY'>(
    (activeContract?.employmentLawRateUnit as 'HOURLY' | 'DAILY') || 'HOURLY'
  );
  const [mileageRate, setMileageRate] = useState(
    activeContract?.mileageRate ? activeContract.mileageRate.toString() : ''
  );
  const [overnightRate, setOvernightRate] = useState(
    activeContract?.overnightRate ? activeContract.overnightRate.toString() : ''
  );

  const [showInScope, setShowInScope] = useState(true);
  const [showOutOfScope, setShowOutOfScope] = useState(true);

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState(client.paymentMethod || '');
  const [directDebitSetup, setDirectDebitSetup] = useState(client.directDebitSetup || false);
  const [directDebitConfirmed, setDirectDebitConfirmed] = useState(client.directDebitConfirmed || false);
  const [contractAddedToXero, setContractAddedToXero] = useState(client.contractAddedToXero);
  const [recurringInvoiceSetup, setRecurringInvoiceSetup] = useState(client.recurringInvoiceSetup || false);
  const [dpaSignedGdpr, setDpaSignedGdpr] = useState(client.dpaSignedGdpr);
  const [firstInvoiceSent, setFirstInvoiceSent] = useState(client.firstInvoiceSent);
  const [firstPaymentMade, setFirstPaymentMade] = useState(client.firstPaymentMade);

  // Handler for contact field changes
  const handleContactChange = (contactId: number, field: string, value: string) => {
    setContacts((prevContacts) =>
      prevContacts.map((contact) =>
        contact.id === contactId
          ? { ...contact, [field]: value }
          : contact
      )
    );
  };

  // Handler for audit field changes
  const handleAuditChange = (auditId: number, field: string, value: string) => {
    setAudits((prevAudits) =>
      prevAudits.map((audit) =>
        audit.id === auditId
          ? { ...audit, [field]: value }
          : audit
      )
    );
  };

  // Handler for audit deletion
  const handleDeleteAudit = async (auditId: number) => {
    if (!confirm('Are you sure you want to delete this audit record?')) {
      return;
    }

    const result = await deleteAudit(auditId);
    if (result.success) {
      setAudits((prevAudits) => prevAudits.filter((audit) => audit.id !== auditId));
      toast.success('Audit record deleted');
    } else {
      toast.error(result.error || 'Failed to delete audit');
    }
  };

  // Save handler
  const handleSaveAll = async () => {
    setIsSaving(true);

    try {
      // Save client changes
      const result = await updateClient(client.id, {
        companyName,
        businessId: businessId || undefined,
        sector: sector || undefined,
        serviceTier: serviceTier as 'TIER_1' | 'DOC_ONLY' | 'AD_HOC',
        monthlyRetainer: monthlyRetainer ? parseFloat(monthlyRetainer) : undefined,
        status: status as 'ACTIVE' | 'INACTIVE' | 'PENDING',
        addressLine1: addressLine1 || undefined,
        addressLine2: addressLine2 || undefined,
        city: city || undefined,
        postcode: postcode || undefined,
        country: country || undefined,
        externalAudit,
        paymentMethod: paymentMethod as 'DIRECT_DEBIT' | 'INVOICE' | undefined,
        directDebitSetup,
        directDebitConfirmed,
        contractAddedToXero,
        recurringInvoiceSetup,
        dpaSignedGdpr,
        firstInvoiceSent,
        firstPaymentMade,
        lastPriceIncrease: lastPriceIncrease ? new Date(lastPriceIncrease) : undefined,
      });

      if (result.success) {
        // Save contact changes if any
        const contactUpdatePromises = contacts.map(async (contact) => {
          const originalContact = client.contacts.find((c) => c.id === contact.id);
          // Only update if something changed
          if (
            originalContact &&
            (originalContact.name !== contact.name ||
              originalContact.email !== contact.email ||
              originalContact.phone !== contact.phone ||
              originalContact.role !== contact.role)
          ) {
            return updateContact(contact.id, {
              name: contact.name,
              email: contact.email,
              phone: contact.phone || undefined,
              role: contact.role || undefined,
            });
          }
          return { success: true };
        });

        const contactResults = await Promise.all(contactUpdatePromises);
        const failedContacts = contactResults.filter((r) => !r.success);

        // Save audit changes if any
        const auditUpdatePromises = audits.map(async (audit) => {
          const originalAudit = client.audits.find((a) => a.id === audit.id);
          // Only update if something changed
          if (
            originalAudit &&
            (originalAudit.auditedBy !== audit.auditedBy ||
              originalAudit.interval !== audit.interval ||
              originalAudit.nextAuditDate !== audit.nextAuditDate)
          ) {
            return updateAudit(audit.id, {
              auditedBy: audit.auditedBy,
              interval: audit.interval as 'QUARTERLY' | 'ANNUALLY' | 'TWO_YEARS' | 'THREE_YEARS' | 'FIVE_YEARS',
              nextAuditDate: new Date(audit.nextAuditDate),
            });
          }
          return { success: true };
        });

        const auditResults = await Promise.all(auditUpdatePromises);
        const failedAudits = auditResults.filter((r) => !r.success);

        // Save contract changes if active contract exists
        if (activeContract) {
          const contractChanged =
            contractStartDate !== new Date(activeContract.contractStartDate).toISOString().split('T')[0] ||
            contractRenewalDate !== new Date(activeContract.contractRenewalDate).toISOString().split('T')[0] ||
            hrAdminInclusiveHours !== (activeContract.hrAdminInclusiveHours ? activeContract.hrAdminInclusiveHours.toString() : '') ||
            hrAdminInclusiveHoursPeriod !== activeContract.hrAdminInclusiveHoursPeriod ||
            employmentLawInclusiveHours !== (activeContract.employmentLawInclusiveHours ? activeContract.employmentLawInclusiveHours.toString() : '') ||
            employmentLawInclusiveHoursPeriod !== activeContract.employmentLawInclusiveHoursPeriod ||
            hrAdminRate !== (activeContract.hrAdminRate ? Number(activeContract.hrAdminRate).toString() : '') ||
            hrAdminRateUnit !== activeContract.hrAdminRateUnit ||
            employmentLawRate !== (activeContract.employmentLawRate ? Number(activeContract.employmentLawRate).toString() : '') ||
            employmentLawRateUnit !== activeContract.employmentLawRateUnit ||
            mileageRate !== (activeContract.mileageRate ? Number(activeContract.mileageRate).toString() : '') ||
            overnightRate !== (activeContract.overnightRate ? Number(activeContract.overnightRate).toString() : '') ||
            JSON.stringify(inclusiveServicesInScope) !== JSON.stringify(activeContract.inclusiveServicesInScope) ||
            JSON.stringify(inclusiveServicesOutOfScope) !== JSON.stringify(activeContract.inclusiveServicesOutOfScope);

          if (contractChanged) {
            const contractResult = await updateContract(activeContract.id, {
              contractStartDate: contractStartDate ? new Date(contractStartDate) : undefined,
              contractRenewalDate: contractRenewalDate ? new Date(contractRenewalDate) : undefined,
              hrAdminInclusiveHours: hrAdminInclusiveHours ? parseFloat(hrAdminInclusiveHours) : undefined,
              hrAdminInclusiveHoursPeriod: hrAdminInclusiveHoursPeriod,
              employmentLawInclusiveHours: employmentLawInclusiveHours ? parseFloat(employmentLawInclusiveHours) : undefined,
              employmentLawInclusiveHoursPeriod: employmentLawInclusiveHoursPeriod,
              inclusiveServicesInScope,
              inclusiveServicesOutOfScope,
              hrAdminRate: hrAdminRate ? parseFloat(hrAdminRate) : undefined,
              hrAdminRateUnit: hrAdminRateUnit,
              employmentLawRate: employmentLawRate ? parseFloat(employmentLawRate) : undefined,
              employmentLawRateUnit: employmentLawRateUnit,
              mileageRate: mileageRate ? parseFloat(mileageRate) : undefined,
              overnightRate: overnightRate ? parseFloat(overnightRate) : undefined,
            });

            if (!contractResult.success) {
              toast.error(contractResult.error || 'Failed to update contract');
              setIsSaving(false);
              return;
            }
          }
        }

        if (failedContacts.length > 0 || failedAudits.length > 0) {
          toast.warning('Some updates failed. Please try again.');
        } else {
          toast.success('All changes saved successfully');

          // Exit edit mode and clean up URL
          setTimeout(() => {
            setEditMode(false);
            const url = new URL(window.location.href);
            url.searchParams.delete('edit');
            window.history.pushState({}, '', url);
            router.refresh();
          }, 500);
        }
      } else {
        toast.error(result.error || 'Failed to save changes');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    setEditMode(initialEditMode);
  }, [initialEditMode]);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-[80%] mx-auto grid-cols-6 h-auto mb-6">
        <TabsTrigger key="company" value="company" className="data-[state=active]:text-primary">
          Company & Tier
        </TabsTrigger>
        <TabsTrigger key="contacts" value="contacts" className="data-[state=active]:text-primary">
          Contacts
        </TabsTrigger>
        <TabsTrigger key="address" value="address" className="data-[state=active]:text-primary">
          Address
        </TabsTrigger>
        <TabsTrigger key="auditing" value="auditing" className="data-[state=active]:text-primary">
          External Auditing
        </TabsTrigger>
        {client.paymentMethod && (
          <TabsTrigger key="payment" value="payment" className="data-[state=active]:text-primary">
            Payment
          </TabsTrigger>
        )}
        <TabsTrigger key="contract-service" value="contract-service" className="data-[state=active]:text-primary">
          Contract and Service
        </TabsTrigger>
      </TabsList>

      {/* Edit/Save Button - Positioned absolutely to appear on all tabs */}
      <div className="absolute top-6 right-4 z-10">
        {editMode ? (
          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className={`h-12 w-12 flex items-center justify-center rounded transition-colors ${
              isSaving
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-red-500 hover:text-green-500'
            }`}
            title={isSaving ? 'Saving...' : 'Save all changes'}
          >
            {isSaving ? (
              <div className="h-8 w-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="h-8 w-8" />
            )}
          </button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-green-800 hover:text-green-600 transition-colors"
            onClick={() => {
              setEditMode(true);
              const url = new URL(window.location.href);
              url.searchParams.set('edit', 'true');
              window.history.pushState({}, '', url);
            }}
            title="Edit client details"
          >
            <SquarePen className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Company & Tier */}
      <TabsContent value="company" className="mt-6 relative">
        <Card className="border-0 shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Building2 className="h-5 w-5" />
              Company and Tier Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {/* Company Name */}
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-sm font-medium text-muted-foreground">
                  Company Name
                </Label>
                {editMode ? (
                  <Input
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full"
                  />
                ) : (
                  <p className="text-base">{client.companyName}</p>
                )}
              </div>

              {/* Business ID */}
              <div className="space-y-2">
                <Label htmlFor="businessId" className="text-sm font-medium text-muted-foreground">
                  Business ID
                </Label>
                {editMode ? (
                  <Input
                    id="businessId"
                    value={businessId}
                    onChange={(e) => setBusinessId(e.target.value)}
                    className="w-full"
                    placeholder="e.g., 12345678"
                  />
                ) : (
                  <p className="text-base">{client.businessId || '-'}</p>
                )}
              </div>

              {/* Sector */}
              <div className="space-y-2">
                <Label htmlFor="sector" className="text-sm font-medium text-muted-foreground">
                  Sector
                </Label>
                {editMode ? (
                  <Input
                    id="sector"
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    className="w-full"
                  />
                ) : (
                  <p className="text-base">{client.sector || '-'}</p>
                )}
              </div>

              {/* Service Tier */}
              <div className="space-y-2">
                <Label htmlFor="serviceTier" className="text-sm font-medium text-muted-foreground">
                  Service Tier
                </Label>
                {editMode ? (
                  <Select value={serviceTier} onValueChange={setServiceTier}>
                    <SelectTrigger id="serviceTier" className="w-full">
                      <SelectValue placeholder="Select tier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TIER_1">Tier 1 - Full Service</SelectItem>
                      <SelectItem value="DOC_ONLY">Doc Only - Documentation</SelectItem>
                      <SelectItem value="AD_HOC">Ad-hoc - As Needed</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-base">{getServiceTierLabel(client.serviceTier)}</p>
                )}
              </div>

              {/* Monthly Retainer */}
              <div className="space-y-2">
                <Label htmlFor="monthlyRetainer" className="text-sm font-medium text-muted-foreground">
                  Monthly Retainer
                </Label>
                {editMode ? (
                  <Input
                    id="monthlyRetainer"
                    type="number"
                    step="0.01"
                    value={monthlyRetainer}
                    onChange={(e) => setMonthlyRetainer(e.target.value)}
                    className="w-full"
                    placeholder="0.00"
                  />
                ) : (
                  <p className="text-base">
                    {client.monthlyRetainer ? `£${client.monthlyRetainer.toFixed(2)}` : '-'}
                  </p>
                )}
              </div>

              {/* Client Status */}
              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-medium text-muted-foreground">
                  Client Status
                </Label>
                {editMode ? (
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger id="status" className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-base">{getStatusLabel(client.status)}</p>
                )}
              </div>

              {/* Last Price Increase */}
              <div className="space-y-2">
                <Label htmlFor="lastPriceIncrease" className="text-sm font-medium text-muted-foreground">
                  Last Price Increase
                </Label>
                {editMode ? (
                  <Input
                    id="lastPriceIncrease"
                    type="date"
                    value={lastPriceIncrease}
                    onChange={(e) => setLastPriceIncrease(e.target.value)}
                    className="w-full"
                  />
                ) : (
                  <p className="text-base">{formatDate(client.lastPriceIncrease)}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Contacts */}
      <TabsContent value="contacts" className="mt-6 relative">
        <Card className="border-0 shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Mail className="h-5 w-5" />
              Client Contacts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ContactTabsProvider>
              <div className="space-y-4">
                <ContactTabButtons contacts={contacts} />
                <ContactDisplay
                  contacts={contacts}
                  editMode={editMode}
                  onContactChange={handleContactChange}
                />
              </div>
            </ContactTabsProvider>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Address */}
      <TabsContent value="address" className="mt-6 relative">
        <Card className="border-0 shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Building2 className="h-5 w-5" />
              Address Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {/* Address Line 1 */}
              <div className="space-y-2">
                <Label htmlFor="addressLine1" className="text-sm font-medium text-muted-foreground">
                  Address Line 1
                </Label>
                {editMode ? (
                  <Input
                    id="addressLine1"
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    className="w-full"
                  />
                ) : (
                  <p className="text-base">{client.addressLine1 || '-'}</p>
                )}
              </div>

              {/* Address Line 2 */}
              <div className="space-y-2">
                <Label htmlFor="addressLine2" className="text-sm font-medium text-muted-foreground">
                  Address Line 2
                </Label>
                {editMode ? (
                  <Input
                    id="addressLine2"
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                    className="w-full"
                  />
                ) : (
                  <p className="text-base">{client.addressLine2 || '-'}</p>
                )}
              </div>

              {/* City */}
              <div className="space-y-2">
                <Label htmlFor="city" className="text-sm font-medium text-muted-foreground">
                  City
                </Label>
                {editMode ? (
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full"
                  />
                ) : (
                  <p className="text-base">{client.city || '-'}</p>
                )}
              </div>

              {/* Postcode */}
              <div className="space-y-2">
                <Label htmlFor="postcode" className="text-sm font-medium text-muted-foreground">
                  Postcode
                </Label>
                {editMode ? (
                  <Input
                    id="postcode"
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value)}
                    className="w-full"
                  />
                ) : (
                  <p className="text-base">{client.postcode || '-'}</p>
                )}
              </div>

              {/* Country */}
              <div className="space-y-2">
                <Label htmlFor="country" className="text-sm font-medium text-muted-foreground">
                  Country
                </Label>
                {editMode ? (
                  <Input
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full"
                  />
                ) : (
                  <p className="text-base">{client.country || '-'}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* External Auditing */}
      <TabsContent value="auditing" className="mt-6 relative">
        <Card className="border-0 shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <ShieldCheck className="h-5 w-5" />
              External Auditing
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Externally Audited Toggle */}
            <div className="mb-6 space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                Externally Audited
              </Label>
              {editMode ? (
                <div className="flex items-center gap-2">
                  <Switch
                    checked={externalAudit}
                    onCheckedChange={setExternalAudit}
                  />
                  <span className="text-sm">{externalAudit ? 'Yes' : 'No'}</span>
                </div>
              ) : (
                <p className="text-base">{client.externalAudit ? 'Yes' : 'No'}</p>
              )}
            </div>

            {audits.length > 0 ? (
              <div className="space-y-4">
                <p className="text-sm font-semibold text-muted-foreground">Audit Details</p>
                {audits.map((audit) => (
                  <div
                    key={audit.id}
                    className="border rounded-lg p-4 bg-muted/50 relative"
                  >
                    {editMode && (
                      <button
                        onClick={() => handleDeleteAudit(audit.id)}
                        className="absolute top-4 right-4 text-red-500 hover:text-red-700 transition-colors"
                        title="Delete audit record"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">
                          Audited By
                        </Label>
                        {editMode ? (
                          <Input
                            value={audit.auditedBy}
                            onChange={(e) => handleAuditChange(audit.id, 'auditedBy', e.target.value)}
                            className="w-full"
                          />
                        ) : (
                          <p className="text-base">{audit.auditedBy}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">
                          Audit Interval
                        </Label>
                        {editMode ? (
                          <Select
                            value={audit.interval}
                            onValueChange={(value) => handleAuditChange(audit.id, 'interval', value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select interval" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                              <SelectItem value="ANNUALLY">Annually</SelectItem>
                              <SelectItem value="TWO_YEARS">Every 2 Years</SelectItem>
                              <SelectItem value="THREE_YEARS">Every 3 Years</SelectItem>
                              <SelectItem value="FIVE_YEARS">Every 5 Years</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="text-base">{formatAuditInterval(audit.interval)}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">
                          Next Audit Date
                        </Label>
                        {editMode ? (
                          <Input
                            type="date"
                            value={audit.nextAuditDate ? new Date(audit.nextAuditDate).toISOString().split('T')[0] : ''}
                            onChange={(e) => handleAuditChange(audit.id, 'nextAuditDate', e.target.value)}
                            className="w-full"
                          />
                        ) : (
                          <p className="text-base">{formatDate(audit.nextAuditDate)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No external audits configured</p>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Payment */}
      {client.paymentMethod && (
        <TabsContent value="payment" className="mt-6 relative">
          <Card className="border-0 shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <CreditCard className="h-5 w-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {/* Payment Method */}
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod" className="text-sm font-medium text-muted-foreground">
                    Payment Method
                  </Label>
                  {editMode ? (
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger id="paymentMethod" className="w-full">
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DIRECT_DEBIT">Direct Debit</SelectItem>
                        <SelectItem value="INVOICE">Invoice</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-base">
                      {client.paymentMethod === 'DIRECT_DEBIT' ? 'Direct Debit' : 'Invoice'}
                    </p>
                  )}
                </div>

                {/* Direct Debit Setup */}
                {paymentMethod === 'DIRECT_DEBIT' && (
                  <>
                    <div className="flex flex-col justify-center space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">
                        Direct Debit Setup
                      </Label>
                      {editMode ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={directDebitSetup}
                            onChange={(e) => setDirectDebitSetup(e.target.checked)}
                            className="h-4 w-4"
                          />
                          <span className="text-sm">Setup complete</span>
                        </div>
                      ) : (
                        <p className="text-base">{client.directDebitSetup ? 'Yes' : 'No'}</p>
                      )}
                    </div>

                    <div className="flex flex-col justify-center space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">
                        Direct Debit Confirmed
                      </Label>
                      {editMode ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={directDebitConfirmed}
                            onChange={(e) => setDirectDebitConfirmed(e.target.checked)}
                            className="h-4 w-4"
                          />
                          <span className="text-sm">Confirmed</span>
                        </div>
                      ) : (
                        <p className="text-base">{client.directDebitConfirmed ? 'Yes' : 'No'}</p>
                      )}
                    </div>
                  </>
                )}

                {/* Contract Added to Xero */}
                <div className="flex flex-col justify-center space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Contract Added to Xero
                  </Label>
                  {editMode ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={contractAddedToXero}
                        onChange={(e) => setContractAddedToXero(e.target.checked)}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">Added to Xero</span>
                    </div>
                  ) : (
                    <p className="text-base">{client.contractAddedToXero ? 'Yes' : 'No'}</p>
                  )}
                </div>

                {/* Recurring Invoice Setup */}
                {paymentMethod === 'INVOICE' && (
                  <div className="flex flex-col justify-center space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">
                      Recurring Invoice Setup
                    </Label>
                    {editMode ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={recurringInvoiceSetup}
                          onChange={(e) => setRecurringInvoiceSetup(e.target.checked)}
                          className="h-4 w-4"
                        />
                        <span className="text-sm">Setup complete</span>
                      </div>
                    ) : (
                      <p className="text-base">{client.recurringInvoiceSetup ? 'Yes' : 'No'}</p>
                    )}
                  </div>
                )}

                {/* DPA Signed (GDPR) */}
                <div className="flex flex-col justify-center space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">
                    DPA Signed (GDPR)
                  </Label>
                  {editMode ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={dpaSignedGdpr}
                        onChange={(e) => setDpaSignedGdpr(e.target.checked)}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">Signed</span>
                    </div>
                  ) : (
                    <p className="text-base">{client.dpaSignedGdpr ? 'Yes' : 'No'}</p>
                  )}
                </div>

                {/* First Invoice Sent */}
                <div className="flex flex-col justify-center space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">
                    First Invoice Sent
                  </Label>
                  {editMode ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={firstInvoiceSent}
                        onChange={(e) => setFirstInvoiceSent(e.target.checked)}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">Sent</span>
                    </div>
                  ) : (
                    <p className="text-base">{client.firstInvoiceSent ? 'Yes' : 'No'}</p>
                  )}
                </div>

                {/* First Payment Made */}
                <div className="flex flex-col justify-center space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">
                    First Payment Made
                  </Label>
                  {editMode ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={firstPaymentMade}
                        onChange={(e) => setFirstPaymentMade(e.target.checked)}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">Received</span>
                    </div>
                  ) : (
                    <p className="text-base">{client.firstPaymentMade ? 'Yes' : 'No'}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      )}

      {/* Contract and Service */}
      <TabsContent value="contract-service" className="mt-6 relative">
        {activeContract ? (
          <Card className="border-0 shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <CheckCircle className="h-5 w-5" />
                Contract Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div key="contract-info">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div key="contract-version" className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Contract Version</p>
                      <p className="text-base">v{activeContract.version}</p>
                    </div>

                    <div key="contract-status" className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Contract Status</p>
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${getContractStatusColor(activeContract.status)}`} />
                        <p className="text-base">{formatContractStatus(activeContract.status)}</p>
                      </div>
                    </div>

                    <div key="contract-start-date" className="space-y-2">
                      <Label htmlFor="contractStartDate" className="text-sm font-medium text-muted-foreground">
                        Contract Start Date
                      </Label>
                      {editMode ? (
                        <Input
                          id="contractStartDate"
                          type="date"
                          value={contractStartDate}
                          onChange={(e) => setContractStartDate(e.target.value)}
                          className="w-full"
                        />
                      ) : (
                        <p className="text-base">{formatDate(activeContract.contractStartDate)}</p>
                      )}
                    </div>

                    <div key="contract-renewal-date" className="space-y-2">
                      <Label htmlFor="contractRenewalDate" className="text-sm font-medium text-muted-foreground">
                        Contract Renewal Date
                      </Label>
                      {editMode ? (
                        <Input
                          id="contractRenewalDate"
                          type="date"
                          value={contractRenewalDate}
                          onChange={(e) => setContractRenewalDate(e.target.value)}
                          className="w-full"
                        />
                      ) : (
                        <p className="text-base">{formatDate(activeContract.contractRenewalDate)}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div key="service-agreement-info">
                  <h4 className="flex items-center gap-2 text-base font-semibold mb-4 text-primary">
                    <FileText className="h-5 w-5" />
                    Service Agreement Information
                  </h4>
                  <Tabs defaultValue="in-scope" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger key="in-scope" value="in-scope" className="data-[state=active]:text-primary">
                        In Scope Service
                      </TabsTrigger>
                      <TabsTrigger key="out-of-scope" value="out-of-scope" className="data-[state=active]:text-primary">
                        Out of Scope Service
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="in-scope" className="space-y-6 mt-4">
                      <div className="flex items-center justify-end mb-3">
                        <Switch
                          checked={showInScope}
                          onCheckedChange={setShowInScope}
                        />
                      </div>
                      <div className={showInScope ? '' : 'opacity-50 pointer-events-none'}>
                        <div className="grid gap-4 md:grid-cols-2 mb-6">
                          <div className="space-y-2">
                            <Label htmlFor="hrAdminInclusiveHours" className="text-sm font-medium text-muted-foreground">
                              HR Admin Inclusive Hours
                            </Label>
                            {editMode ? (
                              <div className="flex gap-2">
                                <Input
                                  id="hrAdminInclusiveHours"
                                  type="number"
                                  step="0.01"
                                  value={hrAdminInclusiveHours}
                                  onChange={(e) => setHrAdminInclusiveHours(e.target.value)}
                                  className="flex-1"
                                  placeholder="0.00"
                                />
                                <Select
                                  value={hrAdminInclusiveHoursPeriod}
                                  onValueChange={(value) => setHrAdminInclusiveHoursPeriod(value as 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY')}
                                >
                                  <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Period" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="WEEKLY">Per Week</SelectItem>
                                    <SelectItem value="MONTHLY">Per Month</SelectItem>
                                    <SelectItem value="QUARTERLY">Per Quarter</SelectItem>
                                    <SelectItem value="YEARLY">Per Year</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            ) : (
                              <p className="text-base">
                                {activeContract.hrAdminInclusiveHours
                                  ? `${activeContract.hrAdminInclusiveHours} hours ${activeContract.hrAdminInclusiveHoursPeriod ? `per ${activeContract.hrAdminInclusiveHoursPeriod.toLowerCase().replace('ly', '')}` : ''}`
                                  : '-'}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="employmentLawInclusiveHours" className="text-sm font-medium text-muted-foreground">
                              Employment Law Inclusive Hours
                            </Label>
                            {editMode ? (
                              <div className="flex gap-2">
                                <Input
                                  id="employmentLawInclusiveHours"
                                  type="number"
                                  step="0.01"
                                  value={employmentLawInclusiveHours}
                                  onChange={(e) => setEmploymentLawInclusiveHours(e.target.value)}
                                  className="flex-1"
                                  placeholder="0.00"
                                />
                                <Select
                                  value={employmentLawInclusiveHoursPeriod}
                                  onValueChange={(value) => setEmploymentLawInclusiveHoursPeriod(value as 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY')}
                                >
                                  <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Period" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="WEEKLY">Per Week</SelectItem>
                                    <SelectItem value="MONTHLY">Per Month</SelectItem>
                                    <SelectItem value="QUARTERLY">Per Quarter</SelectItem>
                                    <SelectItem value="YEARLY">Per Year</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            ) : (
                              <p className="text-base">
                                {activeContract.employmentLawInclusiveHours
                                  ? `${activeContract.employmentLawInclusiveHours} hours ${activeContract.employmentLawInclusiveHoursPeriod ? `per ${activeContract.employmentLawInclusiveHoursPeriod.toLowerCase().replace('ly', '')}` : ''}`
                                  : '-'}
                              </p>
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-medium text-muted-foreground">Inclusive Services</p>
                          </div>
                          <div className="grid gap-3 md:grid-cols-3">
                            {AVAILABLE_SERVICES_IN_SCOPE.map((service) => {
                              const isSelected = inclusiveServicesInScope.includes(service);
                              const handleToggle = () => {
                                if (!editMode) return;
                                if (isSelected) {
                                  setInclusiveServicesInScope(prev => prev.filter(s => s !== service));
                                } else {
                                  setInclusiveServicesInScope(prev => [...prev, service]);
                                }
                              };
                              return (
                                <div
                                  key={service}
                                  onClick={handleToggle}
                                  className={`
                                    flex items-center gap-2 px-3 py-2 rounded-md border text-sm
                                    ${editMode ? 'cursor-pointer hover:bg-muted/50' : ''}
                                    ${
                                      isSelected
                                        ? 'border-primary/50 bg-primary/5'
                                        : 'border-border'
                                    }
                                  `}
                                >
                                  <div
                                    className={`
                                      w-4 h-4 rounded border flex items-center justify-center flex-shrink-0
                                      ${
                                        isSelected
                                          ? 'border-primary bg-primary'
                                          : 'border-muted-foreground/30'
                                      }
                                    `}
                                  >
                                    {isSelected && <X className="h-3 w-3 text-primary-foreground" />}
                                  </div>
                                  <span className="text-left">{service}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="out-of-scope" className="space-y-4 mt-4">
                      <div className="flex items-center justify-end mb-3">
                        <Switch
                          checked={showOutOfScope}
                          onCheckedChange={setShowOutOfScope}
                        />
                      </div>
                      <div className={showOutOfScope ? '' : 'opacity-50 pointer-events-none'}>
                        <div className="grid gap-4 md:grid-cols-2 mb-6">
                          <div className="space-y-2">
                            <Label htmlFor="hrAdminRate" className="text-sm font-medium text-muted-foreground">
                              HR Admin Rate
                            </Label>
                            {editMode ? (
                              <div className="flex gap-2">
                                <Input
                                  id="hrAdminRate"
                                  type="number"
                                  step="0.01"
                                  value={hrAdminRate}
                                  onChange={(e) => setHrAdminRate(e.target.value)}
                                  className="flex-1"
                                  placeholder="0.00"
                                />
                                <Select
                                  value={hrAdminRateUnit}
                                  onValueChange={(value) => setHrAdminRateUnit(value as 'HOURLY' | 'DAILY')}
                                >
                                  <SelectTrigger className="w-[120px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="HOURLY">Per Hour</SelectItem>
                                    <SelectItem value="DAILY">Per Day</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            ) : (
                              <p className="text-base">
                                {activeContract.hrAdminRate
                                  ? `£${activeContract.hrAdminRate} per ${hrAdminRateUnit === 'HOURLY' ? 'hour' : 'day'}`
                                  : '-'}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="employmentLawRate" className="text-sm font-medium text-muted-foreground">
                              Employment Law Rate
                            </Label>
                            {editMode ? (
                              <div className="flex gap-2">
                                <Input
                                  id="employmentLawRate"
                                  type="number"
                                  step="0.01"
                                  value={employmentLawRate}
                                  onChange={(e) => setEmploymentLawRate(e.target.value)}
                                  className="flex-1"
                                  placeholder="0.00"
                                />
                                <Select
                                  value={employmentLawRateUnit}
                                  onValueChange={(value) => setEmploymentLawRateUnit(value as 'HOURLY' | 'DAILY')}
                                >
                                  <SelectTrigger className="w-[120px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="HOURLY">Per Hour</SelectItem>
                                    <SelectItem value="DAILY">Per Day</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            ) : (
                              <p className="text-base">
                                {activeContract.employmentLawRate
                                  ? `£${activeContract.employmentLawRate} per ${employmentLawRateUnit === 'HOURLY' ? 'hour' : 'day'}`
                                  : '-'}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="mileageRate" className="text-sm font-medium text-muted-foreground">
                              Mileage Rate
                            </Label>
                            {editMode ? (
                              <Input
                                id="mileageRate"
                                type="number"
                                step="0.01"
                                value={mileageRate}
                                onChange={(e) => setMileageRate(e.target.value)}
                                className="w-full"
                                placeholder="0.00"
                              />
                            ) : (
                              <p className="text-base">
                                {activeContract.mileageRate ? `£${activeContract.mileageRate}` : '-'}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="overnightRate" className="text-sm font-medium text-muted-foreground">
                              Overnight Rate
                            </Label>
                            {editMode ? (
                              <Input
                                id="overnightRate"
                                type="number"
                                step="0.01"
                                value={overnightRate}
                                onChange={(e) => setOvernightRate(e.target.value)}
                                className="w-full"
                                placeholder="0.00"
                              />
                            ) : (
                              <p className="text-base">
                                {activeContract.overnightRate ? `£${activeContract.overnightRate}` : '-'}
                              </p>
                            )}
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-medium text-muted-foreground">Additional Services</p>
                          </div>
                          <div className="grid gap-3 md:grid-cols-3">
                            {AVAILABLE_SERVICES_OUT_OF_SCOPE.map((service) => {
                              const isSelected = inclusiveServicesOutOfScope.includes(service);
                              const handleToggle = () => {
                                if (!editMode) return;
                                if (isSelected) {
                                  setInclusiveServicesOutOfScope(prev => prev.filter(s => s !== service));
                                } else {
                                  setInclusiveServicesOutOfScope(prev => [...prev, service]);
                                }
                              };
                              return (
                                <div
                                  key={service}
                                  onClick={handleToggle}
                                  className={`
                                    flex items-center gap-2 px-3 py-2 rounded-md border text-sm
                                    ${editMode ? 'cursor-pointer hover:bg-muted/50' : ''}
                                    ${
                                      isSelected
                                        ? 'border-primary/50 bg-primary/5'
                                        : 'border-border'
                                    }
                                  `}
                                >
                                  <div
                                    className={`
                                      w-4 h-4 rounded border flex items-center justify-center flex-shrink-0
                                      ${
                                        isSelected
                                          ? 'border-primary bg-primary'
                                          : 'border-muted-foreground/30'
                                      }
                                    `}
                                  >
                                    {isSelected && <X className="h-3 w-3 text-primary-foreground" />}
                                  </div>
                                  <span className="text-left">{service}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <CheckCircle className="h-5 w-5" />
                Contract Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">No active contract found</p>
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );
}
