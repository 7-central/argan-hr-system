'use client';

import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
    .max(100, 'Sector must be less than 100 characters')
    .optional()
    .or(z.literal('')),
  serviceTier: z.enum(['TIER_1', 'DOC_ONLY', 'AD_HOC']),
  monthlyRetainer: z
    .string()
    .optional()
    .transform((val) => (val && val !== '' ? Number(val) : undefined))
    .pipe(
      z
        .number()
        .positive('Monthly retainer must be positive')
        .max(999999.99, 'Monthly retainer must be less than 1,000,000')
        .optional()
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
    .max(50, 'Phone number must be less than 50 characters')
    .optional()
    .or(z.literal('')),
  contractStartDate: z.string().optional().or(z.literal('')),
  contractRenewalDate: z.string().optional().or(z.literal('')),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING']).default('ACTIVE'),
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
      contractStartDate: client?.contractStartDate
        ? client.contractStartDate.toISOString().split('T')[0]
        : '',
      contractRenewalDate: client?.contractRenewalDate
        ? client.contractRenewalDate.toISOString().split('T')[0]
        : '',
      status: client?.status || 'ACTIVE',
    },
  });

  /**
   * Handle form submission with optimistic updates
   * Preserves form data on errors for easy correction
   */
  const handleSubmit = async (data: ClientFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

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
        contractStartDate:
          data.contractStartDate && data.contractStartDate !== ''
            ? new Date(data.contractStartDate)
            : undefined,
        contractRenewalDate:
          data.contractRenewalDate && data.contractRenewalDate !== ''
            ? new Date(data.contractRenewalDate)
            : undefined,
        status: data.status,
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
        <form onSubmit={form.handleSubmit(handleSubmit as any)} className="space-y-6">
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
              <Label htmlFor="sector">Sector</Label>
              <Input
                id="sector"
                {...form.register('sector')}
                disabled={isSubmitting || isLoading}
                placeholder="e.g., Technology, Healthcare"
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
                <SelectTrigger id="serviceTier">
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

          {/* Financial Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="monthlyRetainer">Monthly Retainer (£)</Label>
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
                <SelectTrigger id="status">
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

          {/* Contact Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contactName">
                Contact Name <span className="text-red-500">*</span>
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
                Contact Email <span className="text-red-500">*</span>
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
              <Label htmlFor="contactPhone">Contact Phone</Label>
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
          </div>

          {/* Contract Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contractStartDate">Contract Start Date</Label>
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
              <Label htmlFor="contractRenewalDate">Contract Renewal Date</Label>
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
    </Card>
  );
}
