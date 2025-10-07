'use client';

import { useState, useEffect } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  Building2,
  BadgePoundSterling,
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
import type { Client, CreateClientDto } from '@/lib/types/client';

/**
 * Client form validation schema
 */
const clientFormSchema = z.object({
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
    .min(1, 'Monthly retainer is required')
    .transform((val) => Number(val))
    .pipe(
      z
        .number()
        .positive('Monthly retainer must be positive')
        .max(999999.99, 'Monthly retainer must be less than 1,000,000')
    ),
  contactName: z
    .string()
    .min(1, 'Contact name is required')
    .max(255, 'Contact name must be less than 255 characters'),
  contactEmail: z
    .string()
    .min(1, 'Contact email is required')
    .email('Invalid email format')
    .max(255, 'Email must be less than 255 characters'),
  contactPhone: z
    .string()
    .min(1, 'Contact phone is required')
    .max(50, 'Phone number must be less than 50 characters'),
  contactRole: z
    .string()
    .max(100, 'Role must be less than 100 characters')
    .optional()
    .or(z.literal('')),
  secondaryContactName: z
    .string()
    .max(255, 'Secondary contact name must be less than 255 characters')
    .optional()
    .or(z.literal('')),
  secondaryContactEmail: z
    .string()
    .email('Invalid email format')
    .max(255, 'Email must be less than 255 characters')
    .optional()
    .or(z.literal('')),
  secondaryContactPhone: z
    .string()
    .max(50, 'Phone number must be less than 50 characters')
    .optional()
    .or(z.literal('')),
  secondaryContactRole: z
    .string()
    .max(100, 'Role must be less than 100 characters')
    .optional()
    .or(z.literal('')),
  invoiceContactName: z
    .string()
    .max(255, 'Invoice contact name must be less than 255 characters')
    .optional()
    .or(z.literal('')),
  invoiceContactEmail: z
    .string()
    .email('Invalid email format')
    .max(255, 'Email must be less than 255 characters')
    .optional()
    .or(z.literal('')),
  invoiceContactPhone: z
    .string()
    .max(50, 'Phone number must be less than 50 characters')
    .optional()
    .or(z.literal('')),
  invoiceContactRole: z
    .string()
    .max(100, 'Role must be less than 100 characters')
    .optional()
    .or(z.literal('')),
  addressLine1: z
    .string()
    .min(1, 'Address line 1 is required')
    .max(255, 'Address line 1 must be less than 255 characters'),
  addressLine2: z
    .string()
    .max(255, 'Address line 2 must be less than 255 characters')
    .optional()
    .or(z.literal('')),
  city: z
    .string()
    .min(1, 'City is required')
    .max(100, 'City must be less than 100 characters'),
  postcode: z
    .string()
    .min(1, 'Postcode is required')
    .max(20, 'Postcode must be less than 20 characters'),
  country: z
    .string()
    .min(1, 'Country is required')
    .max(100, 'Country must be less than 100 characters'),
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
  const [selectedInScopeServices, setSelectedInScopeServices] = useState<string[]>([]);
  const [selectedOutOfScopeServices, setSelectedOutOfScopeServices] = useState<string[]>([]);

  // Calculate default dates
  const today = new Date().toISOString().split('T')[0];
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  const renewalDate = oneYearFromNow.toISOString().split('T')[0];

  const form = useForm<ClientFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(clientFormSchema) as any,
    defaultValues: {
      companyName: client?.companyName || '',
      businessId: client?.businessId || '',
      sector: client?.sector || '',
      serviceTier: client?.serviceTier || 'TIER_1',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      monthlyRetainer: client?.monthlyRetainer ? String(client.monthlyRetainer) : ('' as any),
      contactName: client?.contactName || '',
      contactEmail: client?.contactEmail || '',
      contactPhone: client?.contactPhone || '',
      contactRole: '',
      secondaryContactName: '',
      secondaryContactEmail: '',
      secondaryContactPhone: '',
      secondaryContactRole: '',
      invoiceContactName: '',
      invoiceContactEmail: '',
      invoiceContactPhone: '',
      invoiceContactRole: '',
      addressLine1: client?.addressLine1 || '',
      addressLine2: client?.addressLine2 || '',
      city: client?.city || '',
      postcode: client?.postcode || '',
      country: client?.country || '',
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
      // In Scope Service
      hrAdminInclusiveHours: '',
      employmentLawInclusiveHours: '',
      // Out of Scope Service
      hrAdminRate: '',
      hrAdminRateUnit: undefined,
      employmentLawRate: '',
      employmentLawRateUnit: undefined,
      mileageRate: '',
      overnightRate: '',
    },
  });

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
      const submitData: CreateClientDto = {
        companyName: data.companyName,
        businessId: data.businessId || undefined,
        sector: data.sector || undefined,
        serviceTier: data.serviceTier,
        monthlyRetainer: data.monthlyRetainer,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone || undefined,
        contactRole: data.contactRole || undefined,
        secondaryContactName: data.secondaryContactName || undefined,
        secondaryContactEmail: data.secondaryContactEmail || undefined,
        secondaryContactPhone: data.secondaryContactPhone || undefined,
        secondaryContactRole: data.secondaryContactRole || undefined,
        invoiceContactName: data.invoiceContactName || undefined,
        invoiceContactEmail: data.invoiceContactEmail || undefined,
        invoiceContactPhone: data.invoiceContactPhone || undefined,
        invoiceContactRole: data.invoiceContactRole || undefined,
        addressLine1: data.addressLine1 || undefined,
        addressLine2: data.addressLine2 || undefined,
        city: data.city || undefined,
        postcode: data.postcode || undefined,
        country: data.country || undefined,
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
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="companyName">
                    Company Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="companyName"
                    {...form.register('companyName')}
                    disabled={isSubmitting || isLoading}
                    placeholder="Enter company name"
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
            <CardContent>
              <Tabs defaultValue="primary" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="primary" className="data-[state=active]:text-primary">Primary</TabsTrigger>
                  <TabsTrigger value="secondary" className="data-[state=active]:text-primary">Secondary</TabsTrigger>
                  <TabsTrigger value="invoice" className="data-[state=active]:text-primary">Invoice</TabsTrigger>
                </TabsList>

                <TabsContent value="primary" className="space-y-4 mt-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="contactName">
                        Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="contactName"
                        {...form.register('contactName')}
                        disabled={isSubmitting || isLoading}
                        placeholder="Enter contact person name"
                      />
                      {form.formState.errors.contactName && (
                        <p className="text-sm text-red-500">{form.formState.errors.contactName.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contactEmail">
                        Email <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        {...form.register('contactEmail')}
                        disabled={isSubmitting || isLoading}
                        placeholder="contact@company.com"
                      />
                      {form.formState.errors.contactEmail && (
                        <p className="text-sm text-red-500">{form.formState.errors.contactEmail.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contactPhone">
                        Phone <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="contactPhone"
                        type="tel"
                        {...form.register('contactPhone')}
                        disabled={isSubmitting || isLoading}
                        placeholder="+44 20 1234 5678"
                      />
                      {form.formState.errors.contactPhone && (
                        <p className="text-sm text-red-500">{form.formState.errors.contactPhone.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contactRole">Role</Label>
                      <Input
                        id="contactRole"
                        {...form.register('contactRole')}
                        disabled={isSubmitting || isLoading}
                        placeholder="e.g., HR Manager"
                      />
                      {form.formState.errors.contactRole && (
                        <p className="text-sm text-red-500">{form.formState.errors.contactRole.message}</p>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="secondary" className="space-y-4 mt-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="secondaryContactName">Name</Label>
                      <Input
                        id="secondaryContactName"
                        {...form.register('secondaryContactName')}
                        disabled={isSubmitting || isLoading}
                        placeholder="Enter secondary contact name"
                      />
                      {form.formState.errors.secondaryContactName && (
                        <p className="text-sm text-red-500">
                          {form.formState.errors.secondaryContactName.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="secondaryContactEmail">Email</Label>
                      <Input
                        id="secondaryContactEmail"
                        type="email"
                        {...form.register('secondaryContactEmail')}
                        disabled={isSubmitting || isLoading}
                        placeholder="secondary@company.com"
                      />
                      {form.formState.errors.secondaryContactEmail && (
                        <p className="text-sm text-red-500">
                          {form.formState.errors.secondaryContactEmail.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="secondaryContactPhone">Phone</Label>
                      <Input
                        id="secondaryContactPhone"
                        type="tel"
                        {...form.register('secondaryContactPhone')}
                        disabled={isSubmitting || isLoading}
                        placeholder="+44 20 1234 5678"
                      />
                      {form.formState.errors.secondaryContactPhone && (
                        <p className="text-sm text-red-500">
                          {form.formState.errors.secondaryContactPhone.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="secondaryContactRole">Role</Label>
                      <Input
                        id="secondaryContactRole"
                        {...form.register('secondaryContactRole')}
                        disabled={isSubmitting || isLoading}
                        placeholder="e.g., Finance Director"
                      />
                      {form.formState.errors.secondaryContactRole && (
                        <p className="text-sm text-red-500">
                          {form.formState.errors.secondaryContactRole.message}
                        </p>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="invoice" className="space-y-4 mt-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="invoiceContactName">Name</Label>
                      <Input
                        id="invoiceContactName"
                        {...form.register('invoiceContactName')}
                        disabled={isSubmitting || isLoading}
                        placeholder="Enter invoice contact name"
                      />
                      {form.formState.errors.invoiceContactName && (
                        <p className="text-sm text-red-500">
                          {form.formState.errors.invoiceContactName.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="invoiceContactEmail">Email</Label>
                      <Input
                        id="invoiceContactEmail"
                        type="email"
                        {...form.register('invoiceContactEmail')}
                        disabled={isSubmitting || isLoading}
                        placeholder="invoices@company.com"
                      />
                      {form.formState.errors.invoiceContactEmail && (
                        <p className="text-sm text-red-500">
                          {form.formState.errors.invoiceContactEmail.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="invoiceContactPhone">Phone</Label>
                      <Input
                        id="invoiceContactPhone"
                        type="tel"
                        {...form.register('invoiceContactPhone')}
                        disabled={isSubmitting || isLoading}
                        placeholder="+44 20 1234 5678"
                      />
                      {form.formState.errors.invoiceContactPhone && (
                        <p className="text-sm text-red-500">
                          {form.formState.errors.invoiceContactPhone.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="invoiceContactRole">Role</Label>
                      <Input
                        id="invoiceContactRole"
                        {...form.register('invoiceContactRole')}
                        disabled={isSubmitting || isLoading}
                        placeholder="e.g., Accounts Payable"
                      />
                      {form.formState.errors.invoiceContactRole && (
                        <p className="text-sm text-red-500">
                          {form.formState.errors.invoiceContactRole.message}
                        </p>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
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
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="addressLine1">
                    Address Line 1 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="addressLine1"
                    {...form.register('addressLine1')}
                    disabled={isSubmitting || isLoading}
                    placeholder="Street address"
                  />
                  {form.formState.errors.addressLine1 && (
                    <p className="text-sm text-red-500">{form.formState.errors.addressLine1.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="addressLine2">Address Line 2</Label>
                  <Input
                    id="addressLine2"
                    {...form.register('addressLine2')}
                    disabled={isSubmitting || isLoading}
                    placeholder="Apartment, suite, etc."
                  />
                  {form.formState.errors.addressLine2 && (
                    <p className="text-sm text-red-500">{form.formState.errors.addressLine2.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">
                    City <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="city"
                    {...form.register('city')}
                    disabled={isSubmitting || isLoading}
                    placeholder="City"
                  />
                  {form.formState.errors.city && (
                    <p className="text-sm text-red-500">{form.formState.errors.city.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postcode">
                    Postcode <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="postcode"
                    {...form.register('postcode')}
                    disabled={isSubmitting || isLoading}
                    placeholder="Postcode"
                  />
                  {form.formState.errors.postcode && (
                    <p className="text-sm text-red-500">{form.formState.errors.postcode.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">
                    Country <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="country"
                    {...form.register('country')}
                    disabled={isSubmitting || isLoading}
                    placeholder="United Kingdom"
                  />
                  {form.formState.errors.country && (
                    <p className="text-sm text-red-500">{form.formState.errors.country.message}</p>
                  )}
                </div>
              </div>
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
                <h4 className="text-base font-semibold mb-4 text-primary flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Service Agreement Information
                </h4>
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
              this client as inactive? You can change the status to ACTIVE or PENDING before continuing.
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
    </div>
  );
}
