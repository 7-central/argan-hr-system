'use client';

import { useState, useEffect } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  Building2,
  BadgePoundSterling,
  Calculator,
  Mail,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Check,
  Plus,
  Trash2,
  FileText,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { AVAILABLE_SERVICES_IN_SCOPE, AVAILABLE_SERVICES_OUT_OF_SCOPE } from '@/lib/constants/contract';

import { VatCalculatorModal } from '@/components/modals/vat-calculator-modal';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { SectorSelect } from './sector-select';

import type { OptimisticClientResponse } from '@/lib/hooks/useOptimisticClient';
import type { AddressInput } from '@/lib/types/address';
import type { Client, CreateClientDto } from '@/lib/types/client';
import type { ContactInput } from '@/lib/types/contact';

/**
 * Client form validation schema
 */
const clientFormSchema = z.object({
  clientType: z.enum(['COMPANY', 'INDIVIDUAL']).default('COMPANY'),
  companyName: z
    .string()
    .min(1, 'Company name is required')
    .max(255, 'Company name must be less than 255 characters'),
  businessId: z
    .string()
    .max(50, 'Business ID must be less than 50 characters')
    .optional()
    .or(z.literal('')),
  sector: z
    .string()
    .min(1, 'Sector is required')
    .max(100, 'Sector must be less than 100 characters'),
  serviceTier: z.enum(['TIER_1', 'DOC_ONLY', 'AD_HOC']),
  monthlyRetainer: z
    .string()
    .optional()
    .or(z.literal(''))
    .transform((val) => val ? Number(val) : 0)
    .pipe(
      z
        .number()
        .min(0, 'Monthly retainer must be 0 or greater')
        .max(999999.99, 'Monthly retainer must be less than 1,000,000')
    ),
  // Contact fields removed - managed separately in state
  // Address fields removed - managed separately in state
  contractStartDate: z.string().min(1, 'Contract start date is required'),
  contractRenewalDate: z.string().min(1, 'Contract renewal date is required'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING']).default('INACTIVE'),
  externalAudit: z.boolean().default(false),
  auditedBy: z
    .string()
    .max(255, 'Audited by must be less than 255 characters')
    .optional()
    .or(z.literal('')),
  auditInterval: z
    .enum(['QUARTERLY', 'ANNUALLY', 'TWO_YEARS', 'THREE_YEARS', 'FIVE_YEARS'])
    .optional(),
  nextAuditDate: z.string().optional().or(z.literal('')),
  paymentMethod: z.enum(['INVOICE', 'DIRECT_DEBIT']).optional(),
  chargeVat: z.boolean().default(true),
  // In Scope Service
  hrAdminInclusiveHours: z
    .string()
    .optional()
    .or(z.literal('')),
  employmentLawInclusiveHours: z
    .string()
    .optional()
    .or(z.literal('')),
  // Out of Scope Service
  hrAdminRate: z
    .string()
    .optional()
    .or(z.literal('')),
  hrAdminRateUnit: z.enum(['HOURLY', 'DAILY']).optional(),
  employmentLawRate: z
    .string()
    .optional()
    .or(z.literal('')),
  employmentLawRateUnit: z.enum(['HOURLY', 'DAILY']).optional(),
  mileageRate: z
    .string()
    .optional()
    .or(z.literal('')),
  overnightRate: z
    .string()
    .optional()
    .or(z.literal('')),
});

export type ClientFormData = z.infer<typeof clientFormSchema>;

export interface ClientFormProps {
  client?: Client;
  onSubmit: (data: CreateClientDto) => Promise<OptimisticClientResponse<Client>>;
  onCancel?: () => void;
  isLoading?: boolean;
  className?: string;
}

const STEPS = [
  { id: 1, name: 'Company and Tier', icon: Building2 },
  { id: 2, name: 'Contacts', icon: Mail },
  { id: 3, name: 'Address', icon: Building2 },
  { id: 4, name: 'External Auditing', icon: ShieldCheck },
  { id: 5, name: 'Payment', icon: BadgePoundSterling },
  { id: 6, name: 'Contract and Service', icon: CheckCircle },
];

export function ClientForm({
  client,
  onSubmit,
  onCancel: _onCancel,
  isLoading = false,
  className = '',
}: ClientFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInactiveConfirm, setShowInactiveConfirm] = useState(false);
  const [auditRecords, setAuditRecords] = useState<Array<{
    auditedBy: string;
    auditInterval: 'QUARTERLY' | 'ANNUALLY' | 'TWO_YEARS' | 'THREE_YEARS' | 'FIVE_YEARS' | '';
    nextAuditDate: string;
  }>>([{ auditedBy: '', auditInterval: '', nextAuditDate: '' }]);
  const [contacts, setContacts] = useState<Array<{
    type: 'SERVICE' | 'INVOICE';
    name: string;
    email: string;
    phone: string;
    role: string;
    description: string;
    saved: boolean; // Track if contact is saved
  }>>(!client ? [{
    type: 'SERVICE',
    name: '',
    email: '',
    phone: '',
    role: '',
    description: '',
    saved: false
  }] : []);
  const [addresses, setAddresses] = useState<Array<{
    type: 'SERVICE' | 'INVOICE';
    addressLine1: string;
    addressLine2: string;
    city: string;
    postcode: string;
    country: string;
    description: string;
    saved: boolean; // Track if address is saved
  }>>(!client ? [{
    type: 'SERVICE',
    addressLine1: '',
    addressLine2: '',
    city: '',
    postcode: '',
    country: 'United Kingdom',
    description: '',
    saved: false
  }] : []);
  const [selectedInScopeServices, setSelectedInScopeServices] = useState<string[]>([]);
  const [selectedOutOfScopeServices, setSelectedOutOfScopeServices] = useState<string[]>([]);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [showNoContactsWarning, setShowNoContactsWarning] = useState(false);
  const [openContactAccordion, setOpenContactAccordion] = useState<string[]>([]);
  const [openAddressAccordion, setOpenAddressAccordion] = useState<string[]>([]);

  // Calculate default dates
  const today = new Date().toISOString().split('T')[0];
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  const renewalDate = oneYearFromNow.toISOString().split('T')[0];

  const form = useForm<ClientFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(clientFormSchema) as any,
    defaultValues: {
      clientType: 'COMPANY',
      companyName: client?.companyName || '',
      businessId: client?.businessId || '',
      sector: client?.sector || '',
      serviceTier: client?.serviceTier || 'TIER_1',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      monthlyRetainer: client?.monthlyRetainer ? String(client.monthlyRetainer) : ('' as any),
      // Contact fields removed - managed in contacts state
      // Address fields removed - managed in addresses state
      contractStartDate: client?.contractStartDate
        ? client.contractStartDate.toISOString().split('T')[0]
        : today,
      contractRenewalDate: client?.contractRenewalDate
        ? client.contractRenewalDate.toISOString().split('T')[0]
        : renewalDate,
      status: client?.status || 'INACTIVE',
      externalAudit: client?.externalAudit || false,
      auditedBy: '',
      auditInterval: undefined,
      nextAuditDate: '',
      paymentMethod: undefined,
      chargeVat: true,
      // In Scope Service
      hrAdminInclusiveHours: '',
      employmentLawInclusiveHours: '',
      // Out of Scope Service
      hrAdminRate: '',
      hrAdminRateUnit: 'HOURLY',
      employmentLawRate: '',
      employmentLawRateUnit: 'HOURLY',
      mileageRate: '',
      overnightRate: '',
    },
  });

  const clientType = form.watch('clientType');
  const serviceTier = form.watch('serviceTier');
  const contractStartDate = form.watch('contractStartDate');

  // Auto-set retainer based on service tier
  useEffect(() => {
    if (!client) {
      let defaultRetainer = 0;
      if (serviceTier === 'TIER_1') {
        defaultRetainer = 120;
      } else if (serviceTier === 'DOC_ONLY') {
        defaultRetainer = 30;
      } else if (serviceTier === 'AD_HOC') {
        defaultRetainer = 0;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      form.setValue('monthlyRetainer', String(defaultRetainer) as any);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceTier]);

  // Auto-calculate renewal date
  if (contractStartDate && contractStartDate !== '') {
    const startDate = new Date(contractStartDate);
    const renewal = new Date(startDate);
    renewal.setFullYear(renewal.getFullYear() + 1);
    const renewalDateStr = renewal.toISOString().split('T')[0];

    if (form.getValues('contractRenewalDate') !== renewalDateStr) {
      form.setValue('contractRenewalDate', renewalDateStr);
    }
  }

  const checkStatusAndSubmit = (data: ClientFormData) => {
    // Check for no contacts - show warning but allow proceeding
    if (contacts.length === 0) {
      setShowNoContactsWarning(true);
      return;
    }

    if (data.status === 'INACTIVE') {
      setShowInactiveConfirm(true);
      return;
    }
    handleSubmitInternal(data);
  };

  const handleSubmitInternal = async (data: ClientFormData) => {
    // Validate that at least one service is selected across both scopes
    const totalServicesSelected = selectedInScopeServices.length + selectedOutOfScopeServices.length;
    if (totalServicesSelected === 0) {
      setSubmitError('Please select at least one service (In Scope or Out of Scope)');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    setShowInactiveConfirm(false);

    try {
      // Build contacts array with proper typing
      const contactsArray: ContactInput[] = contacts.map(contact => ({
        type: contact.type,
        name: contact.name,
        email: contact.email,
        phone: contact.phone || undefined,
        role: contact.role || undefined,
        description: contact.description || undefined,
      }));

      // Build addresses array with proper typing
      const addressesArray: AddressInput[] = addresses.map(address => ({
        type: address.type,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2 || undefined,
        city: address.city,
        postcode: address.postcode,
        country: address.country,
        description: address.description || undefined,
      }));

      const submitData: CreateClientDto = {
        clientType: data.clientType,
        companyName: data.companyName,
        businessId: data.businessId || undefined,
        sector: data.sector || undefined,
        serviceTier: data.serviceTier,
        monthlyRetainer: data.monthlyRetainer,
        contacts: contactsArray,
        addresses: addressesArray.length > 0 ? addressesArray : undefined,
        contractStartDate:
          data.contractStartDate && data.contractStartDate !== ''
            ? new Date(data.contractStartDate)
            : undefined,
        contractRenewalDate:
          data.contractRenewalDate && data.contractRenewalDate !== ''
            ? new Date(data.contractRenewalDate)
            : undefined,
        status: data.status,
        externalAudit: data.externalAudit,
        auditRecords: data.externalAudit
          ? auditRecords
              .filter((record) => record.auditedBy && record.auditInterval && record.nextAuditDate)
              .map((record) => ({
                auditedBy: record.auditedBy,
                auditInterval: record.auditInterval as 'QUARTERLY' | 'ANNUALLY' | 'TWO_YEARS' | 'THREE_YEARS' | 'FIVE_YEARS',
                nextAuditDate: new Date(record.nextAuditDate),
              }))
          : undefined,
        paymentMethod: data.paymentMethod,
        chargeVat: data.chargeVat,
        // Service Agreement
        hrAdminInclusiveHours: data.hrAdminInclusiveHours ? parseFloat(data.hrAdminInclusiveHours) : undefined,
        employmentLawInclusiveHours: data.employmentLawInclusiveHours ? parseFloat(data.employmentLawInclusiveHours) : undefined,
        inclusiveServicesInScope: selectedInScopeServices,
        inclusiveServicesOutOfScope: selectedOutOfScopeServices,
        hrAdminRate: data.hrAdminRate ? parseFloat(data.hrAdminRate) : undefined,
        hrAdminRateUnit: data.hrAdminRateUnit,
        employmentLawRate: data.employmentLawRate ? parseFloat(data.employmentLawRate) : undefined,
        employmentLawRateUnit: data.employmentLawRateUnit,
        mileageRate: data.mileageRate ? parseFloat(data.mileageRate) : undefined,
        overnightRate: data.overnightRate ? parseFloat(data.overnightRate) : undefined,
      };

      const result = await onSubmit(submitData);

      if (result.success) {
        setSubmitSuccess(true);
        if (!client) {
          form.reset();
        }
      } else {
        setSubmitError(result.error || 'An unexpected error occurred');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
  };

  const addAuditRecord = () => {
    setAuditRecords([...auditRecords, { auditedBy: '', auditInterval: '', nextAuditDate: '' }]);
  };

  const removeAuditRecord = (index: number) => {
    if (auditRecords.length > 1) {
      setAuditRecords(auditRecords.filter((_, i) => i !== index));
    }
  };

  const updateAuditRecord = (index: number, field: 'auditedBy' | 'auditInterval' | 'nextAuditDate', value: string) => {
    const updated = [...auditRecords];
    updated[index] = { ...updated[index], [field]: value };
    setAuditRecords(updated);
  };

  // Contact management functions
  const addContact = () => {
    setContacts([...contacts, {
      type: 'SERVICE',
      name: '',
      email: '',
      phone: '',
      role: '',
      description: '',
      saved: false // New contact starts as unsaved
    }]);
  };

  const saveContact = (index: number) => {
    const updated = [...contacts];
    updated[index] = { ...updated[index], saved: true };
    setContacts(updated);
    // Auto-open the newly saved contact in the accordion
    setOpenContactAccordion([...openContactAccordion, `contact-${index}`]);
  };

  const removeContact = (index: number) => {
    setContacts(contacts.filter((_, i) => i !== index));
    // Close accordion if the removed contact was open
    if (openContactAccordion.includes(`contact-${index}`)) {
      setOpenContactAccordion(openContactAccordion.filter(id => id !== `contact-${index}`));
    }
  };

  const updateContact = (
    index: number,
    field: 'type' | 'name' | 'email' | 'phone' | 'role' | 'description',
    value: string
  ) => {
    const updated = [...contacts];
    updated[index] = { ...updated[index], [field]: value };
    setContacts(updated);
  };

  // Address management functions
  const addAddress = () => {
    setAddresses([...addresses, {
      type: 'SERVICE',
      addressLine1: '',
      addressLine2: '',
      city: '',
      postcode: '',
      country: 'United Kingdom',
      description: '',
      saved: false // New address starts as unsaved
    }]);
  };

  const saveAddress = (index: number) => {
    const updated = [...addresses];
    updated[index] = { ...updated[index], saved: true };
    setAddresses(updated);
    // Auto-open the newly saved address in the accordion
    setOpenAddressAccordion([...openAddressAccordion, `address-${index}`]);
  };

  const removeAddress = (index: number) => {
    setAddresses(addresses.filter((_, i) => i !== index));
    // Close accordion if the removed address was open
    if (openAddressAccordion.includes(`address-${index}`)) {
      setOpenAddressAccordion(openAddressAccordion.filter(id => id !== `address-${index}`));
    }
  };

  const updateAddress = (
    index: number,
    field: 'type' | 'addressLine1' | 'addressLine2' | 'city' | 'postcode' | 'country' | 'description',
    value: string
  ) => {
    const updated = [...addresses];
    updated[index] = { ...updated[index], [field]: value };
    setAddresses(updated);
  };

  const toggleInScopeService = (service: string) => {
    setSelectedInScopeServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    );
  };

  const toggleOutOfScopeService = (service: string) => {
    setSelectedOutOfScopeServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    );
  };

  const isEditMode = !!client;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Progress Stepper */}
      <div className="flex items-center justify-center gap-6 py-6">
        {/* Previous Chevron */}
        <button
          type="button"
          onClick={previousStep}
          disabled={currentStep === 1 || isSubmitting || isLoading}
          className={`flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all ${
            currentStep === 1 || isSubmitting || isLoading
              ? 'border-muted bg-muted text-muted-foreground cursor-not-allowed opacity-50'
              : 'border-primary bg-primary text-primary-foreground hover:opacity-80 cursor-pointer'
          }`}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Step Indicators Container */}
        <div className="flex items-start justify-center gap-0">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;

            return (
              <div key={step.id} className="flex items-start">
                {/* Step Button with Icon and Label */}
                <button
                  type="button"
                  onClick={() => goToStep(step.id)}
                  className="flex flex-col items-center gap-2.5 transition-all cursor-pointer px-2"
                  disabled={isSubmitting || isLoading}
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                      isCompleted
                        ? 'border-primary bg-primary text-primary-foreground'
                        : isActive
                          ? 'border-primary bg-primary text-primary-foreground animate-pulse'
                          : 'border-gray-300 bg-background text-muted-foreground hover:border-primary/60'
                    }`}
                  >
                    {isCompleted ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span
                    className={`text-xs font-medium whitespace-nowrap ${
                      isActive || isCompleted ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    {step.name}
                  </span>
                </button>

                {/* Connecting Line */}
                {index < STEPS.length - 1 && (
                  <div className="flex items-center pt-5 px-1">
                    <div
                      className={`h-0.5 w-20 transition-all ${
                        currentStep > step.id ? 'bg-primary' : 'bg-gray-300'
                      }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Next Chevron */}
        <button
          type="button"
          onClick={currentStep < STEPS.length ? nextStep : undefined}
          disabled={currentStep === STEPS.length || isSubmitting || isLoading}
          className={`flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all ${
            currentStep === STEPS.length || isSubmitting || isLoading
              ? 'border-muted bg-muted text-muted-foreground cursor-not-allowed opacity-50'
              : 'border-primary bg-primary text-primary-foreground hover:opacity-80 cursor-pointer'
          }`}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Success/Error Messages */}
      {submitSuccess && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Client {isEditMode ? 'updated' : 'created'} successfully!
          </AlertDescription>
        </Alert>
      )}

      {submitError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      {/* Form Steps */}
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <form onSubmit={form.handleSubmit(checkStatusAndSubmit as any)} className="space-y-4">
        {/* Step 1: Company and Tier Information */}
        {currentStep === 1 && (
          <Card className="border-0 shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Building2 className="h-5 w-5" />
                Company and Tier Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Client Type Selection */}
              <div className="space-y-3 pb-4 border-b">
                <Label>Client Type <span className="text-red-500">*</span></Label>
                <div className="grid gap-3 md:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => form.setValue('clientType', 'COMPANY')}
                    disabled={isSubmitting || isLoading}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-md border text-sm
                      transition-all duration-200
                      ${
                        clientType === 'COMPANY'
                          ? 'border-primary/50 bg-primary/5'
                          : 'border-border hover:border-primary/30'
                      }
                      ${isSubmitting || isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    <div
                      className={`
                        w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0
                        transition-all duration-200
                        ${
                          clientType === 'COMPANY'
                            ? 'border-primary'
                            : 'border-muted-foreground/30'
                        }
                      `}
                    >
                      {clientType === 'COMPANY' && (
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <span className="text-left">Company</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => form.setValue('clientType', 'INDIVIDUAL')}
                    disabled={isSubmitting || isLoading}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-md border text-sm
                      transition-all duration-200
                      ${
                        clientType === 'INDIVIDUAL'
                          ? 'border-primary/50 bg-primary/5'
                          : 'border-border hover:border-primary/30'
                      }
                      ${isSubmitting || isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    <div
                      className={`
                        w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0
                        transition-all duration-200
                        ${
                          clientType === 'INDIVIDUAL'
                            ? 'border-primary'
                            : 'border-muted-foreground/30'
                        }
                      `}
                    >
                      {clientType === 'INDIVIDUAL' && (
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <span className="text-left">Individual</span>
                  </button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="companyName">
                    {clientType === 'COMPANY' ? 'Company Name' : 'Name'} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="companyName"
                    {...form.register('companyName')}
                    disabled={isSubmitting || isLoading}
                    placeholder={clientType === 'COMPANY' ? 'Enter company name' : 'Enter individual\'s name'}
                  />
                  {form.formState.errors.companyName && (
                    <p className="text-sm text-red-500">{form.formState.errors.companyName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessId">Business ID</Label>
                  <Input
                    id="businessId"
                    {...form.register('businessId')}
                    disabled={isSubmitting || isLoading}
                    placeholder="Optional business ID"
                  />
                  {form.formState.errors.businessId && (
                    <p className="text-sm text-red-500">{form.formState.errors.businessId.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sector">
                    Sector <span className="text-red-500">*</span>
                  </Label>
                  <SectorSelect
                    value={form.watch('sector')}
                    onChange={(value) => form.setValue('sector', value)}
                    disabled={isSubmitting || isLoading}
                  />
                  {form.formState.errors.sector && (
                    <p className="text-sm text-red-500">{form.formState.errors.sector.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serviceTier">
                    Service Tier <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={form.watch('serviceTier')}
                    onValueChange={(value) =>
                      form.setValue('serviceTier', value as 'TIER_1' | 'DOC_ONLY' | 'AD_HOC')
                    }
                    disabled={isSubmitting || isLoading}
                  >
                    <SelectTrigger id="serviceTier" className="w-full">
                      <SelectValue placeholder="Select service tier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TIER_1">Tier 1 - Full Service</SelectItem>
                      <SelectItem value="DOC_ONLY">Doc Only - Documentation</SelectItem>
                      <SelectItem value="AD_HOC">Ad-hoc - As Needed</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.serviceTier && (
                    <p className="text-sm text-red-500">{form.formState.errors.serviceTier.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Client Status</Label>
                  <Select
                    value={form.watch('status')}
                    onValueChange={(value) =>
                      form.setValue('status', value as 'ACTIVE' | 'INACTIVE' | 'PENDING')
                    }
                    disabled={isSubmitting || isLoading}
                  >
                    <SelectTrigger id="status" className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.status && (
                    <p className="text-sm text-red-500">{form.formState.errors.status.message}</p>
                  )}
                </div>

                {serviceTier !== 'AD_HOC' && (
                  <div className="space-y-2">
                    <Label htmlFor="monthlyRetainer">
                      Monthly Retainer (£) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="monthlyRetainer"
                      type="number"
                      step="0.01"
                      min="0"
                      max="999999.99"
                      {...form.register('monthlyRetainer')}
                      disabled={isSubmitting || isLoading}
                      placeholder="0.00"
                    />
                    {form.formState.errors.monthlyRetainer && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.monthlyRetainer.message}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Contact Information */}
        {currentStep === 2 && (
          <Card className="border-0 shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Mail className="h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Saved Contacts (Accordion) */}
              {contacts.filter(c => c.saved).length > 0 && (
                <Accordion
                  type="multiple"
                  className="w-full"
                  value={openContactAccordion}
                  onValueChange={setOpenContactAccordion}
                >
                  {contacts.map((contact, index) =>
                    contact.saved ? (
                      <AccordionItem key={index} value={`contact-${index}`} className="border-l-2 border-primary pl-6 border-b-0 mb-4">
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
                            {/* Contact Type and Delete Button Row */}
                            <div className="flex gap-2">
                              <div className="space-y-2 flex-1">
                                <Label htmlFor={`contact-type-${index}`}>
                                  Contact Type <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                  value={contact.type}
                                  onValueChange={(value) => updateContact(index, 'type', value)}
                                  disabled={isSubmitting || isLoading}
                                >
                                  <SelectTrigger id={`contact-type-${index}`}>
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
                                  onClick={() => removeContact(index)}
                                  disabled={isSubmitting || isLoading}
                                  className="h-10 w-10 text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            {/* Name and Email */}
                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="space-y-2">
                                <Label htmlFor={`contact-name-${index}`}>
                                  Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  id={`contact-name-${index}`}
                                  value={contact.name}
                                  onChange={(e) => updateContact(index, 'name', e.target.value)}
                                  disabled={isSubmitting || isLoading}
                                  placeholder="Enter contact name"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor={`contact-email-${index}`}>
                                  Email <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  id={`contact-email-${index}`}
                                  type="email"
                                  value={contact.email}
                                  onChange={(e) => updateContact(index, 'email', e.target.value)}
                                  disabled={isSubmitting || isLoading}
                                  placeholder="contact@company.com"
                                />
                              </div>
                            </div>

                            {/* Phone and Role */}
                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="space-y-2">
                                <Label htmlFor={`contact-phone-${index}`}>Phone</Label>
                                <Input
                                  id={`contact-phone-${index}`}
                                  type="tel"
                                  value={contact.phone}
                                  onChange={(e) => updateContact(index, 'phone', e.target.value)}
                                  disabled={isSubmitting || isLoading}
                                  placeholder="+44 20 1234 5678"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor={`contact-role-${index}`}>Role</Label>
                                <Input
                                  id={`contact-role-${index}`}
                                  value={contact.role}
                                  onChange={(e) => updateContact(index, 'role', e.target.value)}
                                  disabled={isSubmitting || isLoading}
                                  placeholder="e.g., HR Manager"
                                />
                              </div>
                            </div>

                            {/* Contact Description */}
                            <div className="space-y-2">
                              <Label htmlFor={`contact-description-${index}`}>Contact Description</Label>
                              <Input
                                id={`contact-description-${index}`}
                                value={contact.description}
                                onChange={(e) => updateContact(index, 'description', e.target.value)}
                                disabled={isSubmitting || isLoading}
                                placeholder="Additional notes about this contact"
                              />
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ) : null
                  )}
                </Accordion>
              )}

              {/* Unsaved Contact (Direct Form) */}
              {contacts.find(c => !c.saved) && (
                <div className="space-y-4">
                  {contacts.filter(c => !c.saved).map((contact) => {
                    const index = contacts.indexOf(contact);
                    return (
                      <div key={index} className="space-y-4 p-4 border border-primary/20 rounded-lg bg-primary/5">
                        {/* Contact Type and Delete Button Row */}
                        <div className="flex gap-2">
                          <div className="space-y-2 flex-1">
                            <Label htmlFor={`contact-type-${index}`}>
                              Contact Type <span className="text-red-500">*</span>
                            </Label>
                            <Select
                              value={contact.type}
                              onValueChange={(value) => updateContact(index, 'type', value)}
                              disabled={isSubmitting || isLoading}
                            >
                              <SelectTrigger id={`contact-type-${index}`}>
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
                              onClick={() => removeContact(index)}
                              disabled={isSubmitting || isLoading}
                              className="h-10 w-10 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Name and Email */}
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor={`contact-name-${index}`}>
                              Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id={`contact-name-${index}`}
                              value={contact.name}
                              onChange={(e) => updateContact(index, 'name', e.target.value)}
                              disabled={isSubmitting || isLoading}
                              placeholder="Enter contact name"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`contact-email-${index}`}>
                              Email <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id={`contact-email-${index}`}
                              type="email"
                              value={contact.email}
                              onChange={(e) => updateContact(index, 'email', e.target.value)}
                              disabled={isSubmitting || isLoading}
                              placeholder="contact@company.com"
                            />
                          </div>
                        </div>

                        {/* Phone and Role */}
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor={`contact-phone-${index}`}>Phone</Label>
                            <Input
                              id={`contact-phone-${index}`}
                              type="tel"
                              value={contact.phone}
                              onChange={(e) => updateContact(index, 'phone', e.target.value)}
                              disabled={isSubmitting || isLoading}
                              placeholder="+44 20 1234 5678"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`contact-role-${index}`}>Role</Label>
                            <Input
                              id={`contact-role-${index}`}
                              value={contact.role}
                              onChange={(e) => updateContact(index, 'role', e.target.value)}
                              disabled={isSubmitting || isLoading}
                              placeholder="e.g., HR Manager"
                            />
                          </div>
                        </div>

                        {/* Contact Description */}
                        <div className="space-y-2">
                          <Label htmlFor={`contact-description-${index}`}>Contact Description</Label>
                          <Input
                            id={`contact-description-${index}`}
                            value={contact.description}
                            onChange={(e) => updateContact(index, 'description', e.target.value)}
                            disabled={isSubmitting || isLoading}
                            placeholder="Additional notes about this contact"
                          />
                        </div>

                        {/* Save Contact Button */}
                        <div className="flex justify-end pt-4 border-t border-primary/20">
                          <Button
                            type="button"
                            onClick={() => saveContact(index)}
                            disabled={isSubmitting || isLoading}
                            className="min-w-[150px]"
                          >
                            Save Contact
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Create New Contact Button */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={addContact}
                disabled={isSubmitting || isLoading || contacts.some(c => !c.saved)}
                className="text-primary hover:text-primary hover:bg-primary/10"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Address */}
        {currentStep === 3 && (
          <Card className="border-0 shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Building2 className="h-5 w-5" />
                Address Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Saved Addresses (Accordion) */}
              {addresses.filter(a => a.saved).length > 0 && (
                <Accordion
                  type="multiple"
                  className="w-full"
                  value={openAddressAccordion}
                  onValueChange={setOpenAddressAccordion}
                >
                  {addresses.map((address, index) =>
                    address.saved ? (
                      <AccordionItem key={index} value={`address-${index}`} className="border-l-2 border-primary pl-6 border-b-0 mb-4">
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
                            {/* Address Type and Delete Button Row */}
                            <div className="flex gap-2">
                              <div className="space-y-2 flex-1">
                                <Label htmlFor={`address-type-${index}`}>
                                  Address Type <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                  value={address.type}
                                  onValueChange={(value) => updateAddress(index, 'type', value)}
                                  disabled={isSubmitting || isLoading}
                                >
                                  <SelectTrigger id={`address-type-${index}`}>
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
                                  onClick={() => removeAddress(index)}
                                  disabled={isSubmitting || isLoading}
                                  className="h-10 w-10 text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            {/* Address Line 1 and 2 */}
                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="space-y-2">
                                <Label htmlFor={`address-line1-${index}`}>
                                  Address Line 1 <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  id={`address-line1-${index}`}
                                  value={address.addressLine1}
                                  onChange={(e) => updateAddress(index, 'addressLine1', e.target.value)}
                                  disabled={isSubmitting || isLoading}
                                  placeholder="Street address"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor={`address-line2-${index}`}>Address Line 2</Label>
                                <Input
                                  id={`address-line2-${index}`}
                                  value={address.addressLine2}
                                  onChange={(e) => updateAddress(index, 'addressLine2', e.target.value)}
                                  disabled={isSubmitting || isLoading}
                                  placeholder="Apartment, suite, etc."
                                />
                              </div>
                            </div>

                            {/* City and Postcode */}
                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="space-y-2">
                                <Label htmlFor={`address-city-${index}`}>
                                  City <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  id={`address-city-${index}`}
                                  value={address.city}
                                  onChange={(e) => updateAddress(index, 'city', e.target.value)}
                                  disabled={isSubmitting || isLoading}
                                  placeholder="City"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor={`address-postcode-${index}`}>
                                  Postcode <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  id={`address-postcode-${index}`}
                                  value={address.postcode}
                                  onChange={(e) => updateAddress(index, 'postcode', e.target.value)}
                                  disabled={isSubmitting || isLoading}
                                  placeholder="Postcode"
                                />
                              </div>
                            </div>

                            {/* Country and Description */}
                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="space-y-2">
                                <Label htmlFor={`address-country-${index}`}>
                                  Country <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  id={`address-country-${index}`}
                                  value={address.country}
                                  onChange={(e) => updateAddress(index, 'country', e.target.value)}
                                  disabled={isSubmitting || isLoading}
                                  placeholder="United Kingdom"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor={`address-description-${index}`}>Description</Label>
                                <Input
                                  id={`address-description-${index}`}
                                  value={address.description}
                                  onChange={(e) => updateAddress(index, 'description', e.target.value)}
                                  disabled={isSubmitting || isLoading}
                                  placeholder="Additional notes about this address"
                                />
                              </div>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ) : null
                  )}
                </Accordion>
              )}

              {/* Unsaved Address (Direct Form) */}
              {addresses.find(a => !a.saved) && (
                <div className="space-y-4">
                  {addresses.filter(a => !a.saved).map((address) => {
                    const index = addresses.indexOf(address);
                    return (
                      <div key={index} className="space-y-4 p-4 border border-primary/20 rounded-lg bg-primary/5">
                        {/* Address Type and Delete Button Row */}
                        <div className="flex gap-2">
                          <div className="space-y-2 flex-1">
                            <Label htmlFor={`address-type-${index}`}>
                              Address Type <span className="text-red-500">*</span>
                            </Label>
                            <Select
                              value={address.type}
                              onValueChange={(value) => updateAddress(index, 'type', value)}
                              disabled={isSubmitting || isLoading}
                            >
                              <SelectTrigger id={`address-type-${index}`}>
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
                              onClick={() => removeAddress(index)}
                              disabled={isSubmitting || isLoading}
                              className="h-10 w-10 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Address Line 1 and 2 */}
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor={`address-line1-${index}`}>
                              Address Line 1 <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id={`address-line1-${index}`}
                              value={address.addressLine1}
                              onChange={(e) => updateAddress(index, 'addressLine1', e.target.value)}
                              disabled={isSubmitting || isLoading}
                              placeholder="Street address"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`address-line2-${index}`}>Address Line 2</Label>
                            <Input
                              id={`address-line2-${index}`}
                              value={address.addressLine2}
                              onChange={(e) => updateAddress(index, 'addressLine2', e.target.value)}
                              disabled={isSubmitting || isLoading}
                              placeholder="Apartment, suite, etc."
                            />
                          </div>
                        </div>

                        {/* City and Postcode */}
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor={`address-city-${index}`}>
                              City <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id={`address-city-${index}`}
                              value={address.city}
                              onChange={(e) => updateAddress(index, 'city', e.target.value)}
                              disabled={isSubmitting || isLoading}
                              placeholder="City"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`address-postcode-${index}`}>
                              Postcode <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id={`address-postcode-${index}`}
                              value={address.postcode}
                              onChange={(e) => updateAddress(index, 'postcode', e.target.value)}
                              disabled={isSubmitting || isLoading}
                              placeholder="Postcode"
                            />
                          </div>
                        </div>

                        {/* Country and Description */}
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor={`address-country-${index}`}>
                              Country <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id={`address-country-${index}`}
                              value={address.country}
                              onChange={(e) => updateAddress(index, 'country', e.target.value)}
                              disabled={isSubmitting || isLoading}
                              placeholder="United Kingdom"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`address-description-${index}`}>Description</Label>
                            <Input
                              id={`address-description-${index}`}
                              value={address.description}
                              onChange={(e) => updateAddress(index, 'description', e.target.value)}
                              disabled={isSubmitting || isLoading}
                              placeholder="Additional notes about this address"
                            />
                          </div>
                        </div>

                        {/* Save Address Button */}
                        <div className="flex justify-end pt-4 border-t border-primary/20">
                          <Button
                            type="button"
                            onClick={() => saveAddress(index)}
                            disabled={isSubmitting || isLoading}
                            className="min-w-[150px]"
                          >
                            Save Address
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Create New Address Button */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={addAddress}
                disabled={isSubmitting || isLoading || addresses.some(a => !a.saved)}
                className="text-primary hover:text-primary hover:bg-primary/10"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 4: External Auditing */}
        {currentStep === 4 && (
          <Card className="border-0 shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <ShieldCheck className="h-5 w-5" />
                External Auditing Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="externalAudit"
                  checked={form.watch('externalAudit')}
                  onCheckedChange={(checked) => form.setValue('externalAudit', checked as boolean)}
                  disabled={isSubmitting || isLoading}
                />
                <Label htmlFor="externalAudit" className="cursor-pointer">
                  Is client externally audited?
                </Label>
              </div>

              {form.watch('externalAudit') && (
                <div className="space-y-4">
                  {auditRecords.map((record, index) => (
                    <div key={index} className="flex gap-2 pl-6 border-l-2 border-primary pb-4">
                      <div className="grid gap-4 md:grid-cols-3 flex-1">
                        <div className="space-y-2">
                          <Label htmlFor={`auditedBy-${index}`}>Audited By</Label>
                          <Input
                            id={`auditedBy-${index}`}
                            value={record.auditedBy}
                            onChange={(e) => updateAuditRecord(index, 'auditedBy', e.target.value)}
                            disabled={isSubmitting || isLoading}
                            placeholder="e.g., External Auditor Name"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`auditInterval-${index}`}>Audit Interval</Label>
                          <Select
                            value={record.auditInterval}
                            onValueChange={(value) => updateAuditRecord(index, 'auditInterval', value)}
                            disabled={isSubmitting || isLoading}
                          >
                            <SelectTrigger id={`auditInterval-${index}`} className="w-full">
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
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`nextAuditDate-${index}`}>Next Audit Date</Label>
                          <Input
                            id={`nextAuditDate-${index}`}
                            type="date"
                            value={record.nextAuditDate}
                            onChange={(e) => updateAuditRecord(index, 'nextAuditDate', e.target.value)}
                            disabled={isSubmitting || isLoading}
                          />
                        </div>
                      </div>

                      {auditRecords.length > 1 && (
                        <div className="space-y-2">
                          <Label className="invisible">Delete</Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeAuditRecord(index)}
                            disabled={isSubmitting || isLoading}
                            className="h-10 w-10 flex-shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50 -mt-0.5"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}

                  <div className="pl-6">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={addAuditRecord}
                      disabled={isSubmitting || isLoading}
                      className="text-primary hover:text-primary hover:bg-primary/10"
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 5: Payment */}
        {currentStep === 5 && (
          <Card className="border-0 shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <BadgePoundSterling className="h-5 w-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Payment Method</Label>
                <div className="grid gap-3 md:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => form.setValue('paymentMethod', 'INVOICE')}
                    disabled={isSubmitting || isLoading}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-md border text-sm
                      transition-all duration-200
                      ${
                        form.watch('paymentMethod') === 'INVOICE'
                          ? 'border-primary/50 bg-primary/5'
                          : 'border-border hover:border-primary/30'
                      }
                      ${isSubmitting || isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    <div
                      className={`
                        w-4 h-4 rounded border flex items-center justify-center flex-shrink-0
                        transition-all duration-200
                        ${
                          form.watch('paymentMethod') === 'INVOICE'
                            ? 'border-primary bg-primary'
                            : 'border-muted-foreground/30'
                        }
                      `}
                    >
                      {form.watch('paymentMethod') === 'INVOICE' && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    <span className="text-left">Invoice</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => form.setValue('paymentMethod', 'DIRECT_DEBIT')}
                    disabled={isSubmitting || isLoading}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-md border text-sm
                      transition-all duration-200
                      ${
                        form.watch('paymentMethod') === 'DIRECT_DEBIT'
                          ? 'border-primary/50 bg-primary/5'
                          : 'border-border hover:border-primary/30'
                      }
                      ${isSubmitting || isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    <div
                      className={`
                        w-4 h-4 rounded border flex items-center justify-center flex-shrink-0
                        transition-all duration-200
                        ${
                          form.watch('paymentMethod') === 'DIRECT_DEBIT'
                            ? 'border-primary bg-primary'
                            : 'border-muted-foreground/30'
                        }
                      `}
                    >
                      {form.watch('paymentMethod') === 'DIRECT_DEBIT' && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    <span className="text-left">Direct Debit</span>
                  </button>
                </div>
              </div>

              {/* VAT Checkbox */}
              <div className="space-y-3">
                <Label>VAT Settings</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="chargeVat"
                    checked={form.watch('chargeVat')}
                    onCheckedChange={(checked) => form.setValue('chargeVat', checked as boolean)}
                    disabled={isSubmitting || isLoading}
                  />
                  <Label htmlFor="chargeVat" className="cursor-pointer text-sm font-normal">
                    Charge VAT on invoices
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground pl-6">
                  Enable this if VAT should be added to invoices for this client
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 6: Contract and Service */}
        {currentStep === 6 && (
          <Card className="border-0 shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <CheckCircle className="h-5 w-5" />
                Contract Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Contract Information Fields */}
              <div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contractStatus">Contract Status</Label>
                    <Select
                      value="ACTIVE"
                      disabled
                    >
                      <SelectTrigger id="contractStatus" className="w-full">
                        <SelectValue placeholder="Active" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      New contracts are created as Active by default
                    </p>
                  </div>
                </div>
              </div>

              {/* Contract Dates */}
              <div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contractStartDate">
                      Contract Start Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="contractStartDate"
                      type="date"
                      {...form.register('contractStartDate')}
                      disabled={isSubmitting || isLoading}
                    />
                    {form.formState.errors.contractStartDate && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.contractStartDate.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contractRenewalDate">
                      Contract Renewal Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="contractRenewalDate"
                      type="date"
                      {...form.register('contractRenewalDate')}
                      disabled={isSubmitting || isLoading}
                    />
                    {form.formState.errors.contractRenewalDate && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.contractRenewalDate.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Service Agreement Information */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-base font-semibold text-primary flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Service Agreement Information
                  </h4>
                  <button
                    type="button"
                    onClick={() => setCalculatorOpen(true)}
                    className="text-purple-600 hover:text-purple-700 transition-colors"
                    title="VAT Calculator"
                  >
                    <Calculator className="h-5 w-5" />
                  </button>
                </div>
                <Tabs defaultValue="in-scope" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="in-scope" className="data-[state=active]:text-primary">In Scope Service</TabsTrigger>
                    <TabsTrigger value="out-of-scope" className="data-[state=active]:text-primary">Out of Scope Service</TabsTrigger>
                  </TabsList>

                  <TabsContent value="in-scope" className="space-y-6 mt-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="hrAdminInclusiveHours">HR Admin Inclusive Hours</Label>
                        <Input
                          id="hrAdminInclusiveHours"
                          type="number"
                          step="0.01"
                          min="0"
                          {...form.register('hrAdminInclusiveHours')}
                          disabled={isSubmitting || isLoading}
                          placeholder="e.g., 10"
                        />
                        {form.formState.errors.hrAdminInclusiveHours && (
                          <p className="text-sm text-red-500">
                            {form.formState.errors.hrAdminInclusiveHours.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="employmentLawInclusiveHours">Employment Law Inclusive Hours</Label>
                        <Input
                          id="employmentLawInclusiveHours"
                          type="number"
                          step="0.01"
                          min="0"
                          {...form.register('employmentLawInclusiveHours')}
                          disabled={isSubmitting || isLoading}
                          placeholder="e.g., 5"
                        />
                        {form.formState.errors.employmentLawInclusiveHours && (
                          <p className="text-sm text-red-500">
                            {form.formState.errors.employmentLawInclusiveHours.message}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Inclusive Services */}
                    <div>
                      <Label className="mb-3 block">Inclusive Services</Label>
                      <div className="grid gap-3 md:grid-cols-3">
                        {AVAILABLE_SERVICES_IN_SCOPE.map((service) => {
                          const isSelected = selectedInScopeServices.includes(service);
                          return (
                            <button
                              key={service}
                              type="button"
                              onClick={() => toggleInScopeService(service)}
                              disabled={isSubmitting || isLoading}
                              className={`
                                flex items-center gap-2 px-3 py-2 rounded-md border text-sm
                                transition-all duration-200
                                ${
                                  isSelected
                                    ? 'border-primary/50 bg-primary/5'
                                    : 'border-border hover:border-primary/30'
                                }
                                ${isSubmitting || isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                              `}
                            >
                              <div
                                className={`
                                  w-4 h-4 rounded border flex items-center justify-center flex-shrink-0
                                  transition-all duration-200
                                  ${
                                    isSelected
                                      ? 'border-primary bg-primary'
                                      : 'border-muted-foreground/30'
                                  }
                                `}
                              >
                                {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                              </div>
                              <span className="text-left">{service}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="out-of-scope" className="space-y-4 mt-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      {/* HR Admin Rate */}
                      <div className="space-y-2">
                        <Label htmlFor="hrAdminRate">HR Admin Rate (£)</Label>
                        <div className="flex gap-2">
                          <Input
                            id="hrAdminRate"
                            type="number"
                            step="0.01"
                            min="0"
                            {...form.register('hrAdminRate')}
                            disabled={isSubmitting || isLoading}
                            placeholder="e.g., 75"
                            className="flex-1"
                          />
                          <Select
                            value={form.watch('hrAdminRateUnit')}
                            onValueChange={(value) =>
                              form.setValue('hrAdminRateUnit', value as 'HOURLY' | 'DAILY')
                            }
                            disabled={isSubmitting || isLoading}
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue placeholder="Unit" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="HOURLY">Per Hour</SelectItem>
                              <SelectItem value="DAILY">Per Day</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {form.formState.errors.hrAdminRate && (
                          <p className="text-sm text-red-500">{form.formState.errors.hrAdminRate.message}</p>
                        )}
                      </div>

                      {/* Employment Law Rate */}
                      <div className="space-y-2">
                        <Label htmlFor="employmentLawRate">Employment Law Rate (£)</Label>
                        <div className="flex gap-2">
                          <Input
                            id="employmentLawRate"
                            type="number"
                            step="0.01"
                            min="0"
                            {...form.register('employmentLawRate')}
                            disabled={isSubmitting || isLoading}
                            placeholder="e.g., 150"
                            className="flex-1"
                          />
                          <Select
                            value={form.watch('employmentLawRateUnit')}
                            onValueChange={(value) =>
                              form.setValue('employmentLawRateUnit', value as 'HOURLY' | 'DAILY')
                            }
                            disabled={isSubmitting || isLoading}
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue placeholder="Unit" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="HOURLY">Per Hour</SelectItem>
                              <SelectItem value="DAILY">Per Day</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {form.formState.errors.employmentLawRate && (
                          <p className="text-sm text-red-500">{form.formState.errors.employmentLawRate.message}</p>
                        )}
                      </div>

                      {/* Mileage Rate */}
                      <div className="space-y-2">
                        <Label htmlFor="mileageRate">Mileage Rate (£ per mile)</Label>
                        <Input
                          id="mileageRate"
                          type="number"
                          step="0.01"
                          min="0"
                          {...form.register('mileageRate')}
                          disabled={isSubmitting || isLoading}
                          placeholder="e.g., 0.45"
                        />
                        {form.formState.errors.mileageRate && (
                          <p className="text-sm text-red-500">{form.formState.errors.mileageRate.message}</p>
                        )}
                      </div>

                      {/* Overnight Rate */}
                      <div className="space-y-2">
                        <Label htmlFor="overnightRate">Overnight Rate (£ per night)</Label>
                        <Input
                          id="overnightRate"
                          type="number"
                          step="0.01"
                          min="0"
                          {...form.register('overnightRate')}
                          disabled={isSubmitting || isLoading}
                          placeholder="e.g., 85"
                        />
                        {form.formState.errors.overnightRate && (
                          <p className="text-sm text-red-500">{form.formState.errors.overnightRate.message}</p>
                        )}
                      </div>
                    </div>

                    {/* Additional Services */}
                    <div>
                      <Label className="mb-3 block">Additional Services</Label>
                      <div className="grid gap-3 md:grid-cols-3">
                        {AVAILABLE_SERVICES_OUT_OF_SCOPE.map((service) => {
                          const isSelected = selectedOutOfScopeServices.includes(service);
                          return (
                            <button
                              key={service}
                              type="button"
                              onClick={() => toggleOutOfScopeService(service)}
                              disabled={isSubmitting || isLoading}
                              className={`
                                flex items-center gap-2 px-3 py-2 rounded-md border text-sm
                                transition-all duration-200
                                ${
                                  isSelected
                                    ? 'border-primary/50 bg-primary/5'
                                    : 'border-border hover:border-primary/30'
                                }
                                ${isSubmitting || isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                              `}
                            >
                              <div
                                className={`
                                  w-4 h-4 rounded border flex items-center justify-center flex-shrink-0
                                  transition-all duration-200
                                  ${
                                    isSelected
                                      ? 'border-primary bg-primary'
                                      : 'border-muted-foreground/30'
                                  }
                                `}
                              >
                                {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                              </div>
                              <span className="text-left">{service}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Submit Button - Only on last step */}
              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isSubmitting || isLoading} className="min-w-[180px]">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isEditMode ? 'Updating...' : 'Creating...'}
                    </>
                  ) : isEditMode ? (
                    'Update Client'
                  ) : (
                    'Create Client'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </form>

      {/* Inactive Status Confirmation Dialog */}
      <AlertDialog open={showInactiveConfirm} onOpenChange={setShowInactiveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Client Status is Inactive</AlertDialogTitle>
            <AlertDialogDescription>
              The client status is still set to <strong>INACTIVE</strong>. Are you sure you want to create
              this client as inactive? If you click &apos;Go Back&apos; you can change the status to ACTIVE or PENDING before continuing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go Back</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const data = form.getValues();
                handleSubmitInternal(data);
              }}
            >
              Yes, Create as Inactive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* No Contacts Warning Dialog */}
      <AlertDialog open={showNoContactsWarning} onOpenChange={setShowNoContactsWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>No Contacts Added</AlertDialogTitle>
            <AlertDialogDescription>
              You haven&apos;t added any contacts for this client. While this is allowed, it&apos;s recommended to have at least one contact person for communication purposes.
              <br /><br />
              Would you like to go back and add a contact, or continue without any contacts?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go Back and Add Contact</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowNoContactsWarning(false);
                const data = form.getValues();
                // Check status next
                if (data.status === 'INACTIVE') {
                  setShowInactiveConfirm(true);
                } else {
                  handleSubmitInternal(data);
                }
              }}
            >
              Continue Without Contacts
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* VAT Calculator Modal */}
      <VatCalculatorModal
        open={calculatorOpen}
        onOpenChange={setCalculatorOpen}
      />
    </div>
  );
}
