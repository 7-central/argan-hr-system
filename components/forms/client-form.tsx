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
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';


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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
 * Ensures type-safe form validation with proper error messages
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
  // Secondary contact (optional)
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
  // Invoice contact (optional)
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
});

/**
 * Form data type derived from schema
 * Used for type-safe form handling
 */
export type ClientFormData = z.infer<typeof clientFormSchema>;

/**
 * Props for the ClientForm component
 * Supports both create and edit modes
 */
export interface ClientFormProps {
  /** Existing client data for edit mode (optional) */
  client?: Client;
  /** Function called on successful submission */
  onSubmit: (data: CreateClientDto) => Promise<OptimisticClientResponse<Client>>;
  /** Function called when form is cancelled */
  onCancel?: () => void;
  /** Whether the form is in a loading state */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Client form component with optimistic updates
 * Provides immediate feedback and smooth error handling
 *
 * Features:
 * - Optimistic form submission with instant feedback
 * - Form data preservation on errors for easy correction
 * - Comprehensive validation with clear error messages
 * - Responsive design with proper loading states
 * - Integration with existing loading system from Story 2.1
 *
 * @param props - ClientForm props
 * @returns JSX element for client form
 *
 * @example
 * ```typescript
 * <ClientForm
 *   onSubmit={createClientOptimistic}
 *   onCancel={() => router.back()}
 * />
 * ```
 */
export function ClientForm({
  client,
  onSubmit,
  onCancel,
  isLoading = false,
  className = '',
}: ClientFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInactiveConfirm, setShowInactiveConfirm] = useState(false);

  // Calculate default dates
  const today = new Date().toISOString().split('T')[0];
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  const renewalDate = oneYearFromNow.toISOString().split('T')[0];

  // Set up form with validation
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
    },
  });

  /**
   * Auto-set monthly retainer based on service tier
   */
  const serviceTier = form.watch('serviceTier');

  // Set retainer when service tier changes
  useEffect(() => {
    // Only auto-set on initial tier selection, not when editing
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

  /**
   * Auto-calculate renewal date when start date changes
   */
  const contractStartDate = form.watch('contractStartDate');

  // Update renewal date whenever start date changes
  if (contractStartDate && contractStartDate !== '') {
    const startDate = new Date(contractStartDate);
    const renewal = new Date(startDate);
    renewal.setFullYear(renewal.getFullYear() + 1);
    const renewalDateStr = renewal.toISOString().split('T')[0];

    if (form.getValues('contractRenewalDate') !== renewalDateStr) {
      form.setValue('contractRenewalDate', renewalDateStr);
    }
  }

  /**
   * Check status and show confirmation if INACTIVE
   */
  const checkStatusAndSubmit = (data: ClientFormData) => {
    if (data.status === 'INACTIVE') {
      setShowInactiveConfirm(true);
      return;
    }
    handleSubmitInternal(data);
  };

  /**
   * Handle form submission with optimistic updates
   * Preserves form data on errors for easy correction
   */
  const handleSubmitInternal = async (data: ClientFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    setShowInactiveConfirm(false);

    try {
      // Transform form data for API
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
        auditedBy: data.auditedBy || undefined,
        auditInterval: data.auditInterval || undefined,
        nextAuditDate: data.nextAuditDate && data.nextAuditDate !== '' ? new Date(data.nextAuditDate) : undefined,
      };

      // Call optimistic submit function
      const result = await onSubmit(submitData);

      if (result.success) {
        // Success! Show brief success state
        setSubmitSuccess(true);

        // Reset form only if creating new client
        if (!client) {
          form.reset();
        }
      } else {
        // Error occurred - form data is preserved automatically
        setSubmitError(result.error || 'An unexpected error occurred');
      }
    } catch (error) {
      // Catch any unexpected errors
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditMode = !!client;
  const formTitle = isEditMode ? 'Edit Client' : 'Create New Client';
  const formDescription = isEditMode
    ? 'Update client information and preferences'
    : 'Add a new client to your HR consultancy system';

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{formTitle}</CardTitle>
        <CardDescription>{formDescription}</CardDescription>
      </CardHeader>

      <CardContent>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <form onSubmit={form.handleSubmit(checkStatusAndSubmit as any)} className="space-y-6">
          {/* Success Message */}
          {submitSuccess && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Client {isEditMode ? 'updated' : 'created'} successfully!
              </AlertDescription>
            </Alert>
          )}

          {/* Error Message */}
          {submitError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          {/* Company Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Company Information
            </h3>
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
            </div>
          </div>

          {/* Service Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BadgePoundSterling className="h-5 w-5" />
              Service Information
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
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
              <Label htmlFor="status">Status</Label>
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
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Contact Information
            </h3>

            <Tabs defaultValue="primary" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="primary">Primary</TabsTrigger>
                <TabsTrigger value="secondary">Secondary</TabsTrigger>
                <TabsTrigger value="invoice">Invoice</TabsTrigger>
              </TabsList>

              <TabsContent value="primary" className="space-y-4">
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

              <TabsContent value="secondary" className="space-y-4">
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

              <TabsContent value="invoice" className="space-y-4">
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
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Address
            </h3>
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
          </div>

          {/* Contract Information */}
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

          {/* External Auditing */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              External Auditing
            </h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="externalAudit"
                  checked={form.watch('externalAudit')}
                  onCheckedChange={(checked) => form.setValue('externalAudit', checked as boolean)}
                  disabled={isSubmitting || isLoading}
                />
                <Label htmlFor="externalAudit" className="cursor-pointer">
                  Client is externally audited
                </Label>
              </div>

              {form.watch('externalAudit') && (
                <div className="grid gap-4 md:grid-cols-3 pl-6 border-l-2 border-muted">
                  <div className="space-y-2">
                    <Label htmlFor="auditedBy">Audited By</Label>
                    <Input
                      id="auditedBy"
                      {...form.register('auditedBy')}
                      disabled={isSubmitting || isLoading}
                      placeholder="e.g., External Auditor Name"
                    />
                    {form.formState.errors.auditedBy && (
                      <p className="text-sm text-red-500">{form.formState.errors.auditedBy.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="auditInterval">Audit Interval</Label>
                    <Select
                      value={form.watch('auditInterval')}
                      onValueChange={(value) =>
                        form.setValue(
                          'auditInterval',
                          value as 'QUARTERLY' | 'ANNUALLY' | 'TWO_YEARS' | 'THREE_YEARS' | 'FIVE_YEARS'
                        )
                      }
                      disabled={isSubmitting || isLoading}
                    >
                      <SelectTrigger id="auditInterval" className="w-full">
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
                    {form.formState.errors.auditInterval && (
                      <p className="text-sm text-red-500">{form.formState.errors.auditInterval.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nextAuditDate">Next Audit Date</Label>
                    <Input
                      id="nextAuditDate"
                      type="date"
                      {...form.register('nextAuditDate')}
                      disabled={isSubmitting || isLoading}
                    />
                    {form.formState.errors.nextAuditDate && (
                      <p className="text-sm text-red-500">{form.formState.errors.nextAuditDate.message}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={isSubmitting || isLoading} className="min-w-[120px]">
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

            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting || isLoading}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>

      {/* Inactive Status Confirmation Dialog */}
      <AlertDialog open={showInactiveConfirm} onOpenChange={setShowInactiveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Client Status is Inactive</AlertDialogTitle>
            <AlertDialogDescription>
              The client status is still set to <strong>INACTIVE</strong>. Are you sure you want to
              create this client as inactive? You can change the status to ACTIVE or PENDING before
              continuing.
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
    </Card>
  );
}
