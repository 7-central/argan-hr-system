'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle, Check, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { checkActiveContract, createContract } from '@/lib/actions/contract.actions';
import {
  AVAILABLE_SERVICES_IN_SCOPE,
  AVAILABLE_SERVICES_OUT_OF_SCOPE,
  type ServiceInScope,
  type ServiceOutOfScope,
} from '@/lib/constants/contract';

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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * Contract form validation schema
 */
const contractFormSchema = z.object({
  status: z.enum(['ACTIVE', 'DRAFT', 'ARCHIVED']),
  contractStartDate: z.string().min(1, 'Contract start date is required'),
  contractRenewalDate: z.string().min(1, 'Contract renewal date is required'),
  hrAdminInclusiveHours: z.string().optional(),
  hrAdminInclusiveHoursPeriod: z.enum(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']).optional(),
  employmentLawInclusiveHours: z.string().optional(),
  employmentLawInclusiveHoursPeriod: z.enum(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']).optional(),
  hrAdminRate: z.string().optional(),
  hrAdminRateUnit: z.enum(['HOURLY', 'DAILY']).optional(),
  employmentLawRate: z.string().optional(),
  employmentLawRateUnit: z.enum(['HOURLY', 'DAILY']).optional(),
  mileageRate: z.string().optional(),
  overnightRate: z.string().optional(),
});

type ContractFormData = z.infer<typeof contractFormSchema>;

interface ContractFormProps {
  clientId: number;
  companyName: string;
  nextVersion: number;
}

export function ContractForm({ clientId, companyName, nextVersion }: ContractFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  const [selectedInScopeServices, setSelectedInScopeServices] = useState<ServiceInScope[]>([]);
  const [selectedOutOfScopeServices, setSelectedOutOfScopeServices] = useState<ServiceOutOfScope[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Calculate default dates
  const today = new Date();
  const todayString = today.toISOString().split('T')[0];
  const oneYearLater = new Date(today);
  oneYearLater.setFullYear(today.getFullYear() + 1);
  const oneYearLaterString = oneYearLater.toISOString().split('T')[0];

  const form = useForm<ContractFormData>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: {
      status: 'ACTIVE',
      contractStartDate: todayString,
      contractRenewalDate: oneYearLaterString,
      hrAdminInclusiveHours: '',
      hrAdminInclusiveHoursPeriod: undefined,
      employmentLawInclusiveHours: '',
      employmentLawInclusiveHoursPeriod: undefined,
      hrAdminRate: '',
      hrAdminRateUnit: undefined,
      employmentLawRate: '',
      employmentLawRateUnit: undefined,
      mileageRate: '',
      overnightRate: '',
    },
  });

  // Toggle In Scope service selection
  const toggleInScopeService = (service: ServiceInScope) => {
    setSelectedInScopeServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    );
  };

  // Toggle Out of Scope service selection
  const toggleOutOfScopeService = (service: ServiceOutOfScope) => {
    setSelectedOutOfScopeServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    );
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (data: ContractFormData) => {
    setSubmitError(null);

    // Validate at least one service is selected
    const totalServicesSelected = selectedInScopeServices.length + selectedOutOfScopeServices.length;
    if (totalServicesSelected === 0) {
      setSubmitError('Please select at least one service (In Scope or Out of Scope)');
      return;
    }

    // Only check for active contracts if creating an ACTIVE contract
    if (data.status === 'ACTIVE') {
      const activeCheck = await checkActiveContract(clientId);

      if (!activeCheck.success) {
        toast.error('Failed to check for active contracts', {
          description: activeCheck.error,
        });
        return;
      }

      // If has active contract, show replace dialog
      if (activeCheck.hasActive) {
        setShowReplaceDialog(true);
        return;
      }
    }

    // Create contract with selected status
    await createContractInternal(data, false);
  };

  /**
   * Create contract with specified replace setting
   */
  const createContractInternal = async (data: ContractFormData, replaceExisting: boolean) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await createContract({
        clientId,
        contractStartDate: new Date(data.contractStartDate),
        contractRenewalDate: new Date(data.contractRenewalDate),
        status: data.status,
        hrAdminInclusiveHours: data.hrAdminInclusiveHours ? parseFloat(data.hrAdminInclusiveHours) : undefined,
        hrAdminInclusiveHoursPeriod: data.hrAdminInclusiveHoursPeriod,
        employmentLawInclusiveHours: data.employmentLawInclusiveHours
          ? parseFloat(data.employmentLawInclusiveHours)
          : undefined,
        employmentLawInclusiveHoursPeriod: data.employmentLawInclusiveHoursPeriod,
        inclusiveServicesInScope: selectedInScopeServices,
        inclusiveServicesOutOfScope: selectedOutOfScopeServices,
        hrAdminRate: data.hrAdminRate ? parseFloat(data.hrAdminRate) : undefined,
        hrAdminRateUnit: data.hrAdminRateUnit,
        employmentLawRate: data.employmentLawRate ? parseFloat(data.employmentLawRate) : undefined,
        employmentLawRateUnit: data.employmentLawRateUnit,
        mileageRate: data.mileageRate ? parseFloat(data.mileageRate) : undefined,
        overnightRate: data.overnightRate ? parseFloat(data.overnightRate) : undefined,
        replaceExisting,
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to create contract');
      }

      toast.success('Contract created successfully', {
        description: `Contract ${result.data.contractNumber} has been created`,
      });

      // Navigate back to client view page
      router.push(`/admin/clients/${clientId}`);
      router.refresh();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setSubmitError(errorMessage);
      toast.error('Failed to create contract', {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
      setShowReplaceDialog(false);
    }
  };

  return (
    <>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="w-full">
        <Card className="border-0 shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <CheckCircle className="h-5 w-5" />
              New Contract for {companyName}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Error Display */}
            {submitError && (
              <div className="rounded-md bg-red-50 p-4 border border-red-200">
                <p className="text-sm text-red-600">{submitError}</p>
              </div>
            )}

            {/* Contract Information */}
            <div>
              <h4 className="text-base font-semibold mb-4 text-primary">Contract Information</h4>
              <div className="grid gap-4 md:grid-cols-2">
                {/* Version Field (Read-only) */}
                <div className="space-y-2">
                  <Label htmlFor="version">Contract Version</Label>
                  <Input
                    id="version"
                    value={`v${nextVersion}`}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    This will be version {nextVersion} for this client
                  </p>
                </div>

                {/* Status Field */}
                <div className="space-y-2">
                  <Label htmlFor="status">
                    Contract Status <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={form.watch('status')}
                    onValueChange={(value) => form.setValue('status', value as 'ACTIVE' | 'DRAFT' | 'ARCHIVED')}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="ARCHIVED">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.status && (
                    <p className="text-sm text-red-500">{form.formState.errors.status.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {form.watch('status') === 'ACTIVE' && 'This contract will be set as the active contract'}
                    {form.watch('status') === 'DRAFT' && 'This contract will be saved as a draft'}
                    {form.watch('status') === 'ARCHIVED' && 'This contract will be archived immediately'}
                  </p>
                </div>
              </div>
            </div>

            {/* Contract Dates */}
            <div>
              <h4 className="text-base font-semibold mb-4 text-primary">Contract Dates</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contractStartDate">
                    Contract Start Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="contractStartDate"
                    type="date"
                    {...form.register('contractStartDate')}
                    disabled={isSubmitting}
                  />
                  {form.formState.errors.contractStartDate && (
                    <p className="text-sm text-red-500">{form.formState.errors.contractStartDate.message}</p>
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
                    disabled={isSubmitting}
                  />
                  {form.formState.errors.contractRenewalDate && (
                    <p className="text-sm text-red-500">{form.formState.errors.contractRenewalDate.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Service Agreement */}
            <div>
              <h4 className="text-base font-semibold mb-4 text-primary">Service Agreement</h4>
              <Tabs defaultValue="in-scope" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="in-scope" className="data-[state=active]:text-primary">
                    In Scope Service
                  </TabsTrigger>
                  <TabsTrigger value="out-of-scope" className="data-[state=active]:text-primary">
                    Out of Scope Service
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="in-scope" className="space-y-6 mt-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="hrAdminInclusiveHours">HR Admin Inclusive Hours</Label>
                      <div className="flex gap-2">
                        <Input
                          id="hrAdminInclusiveHours"
                          type="number"
                          step="0.01"
                          min="0"
                          {...form.register('hrAdminInclusiveHours')}
                          disabled={isSubmitting}
                          placeholder="e.g., 10"
                          className="flex-1"
                        />
                        <Select
                          value={form.watch('hrAdminInclusiveHoursPeriod')}
                          onValueChange={(value) =>
                            form.setValue('hrAdminInclusiveHoursPeriod', value as 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY')
                          }
                          disabled={isSubmitting}
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
                      {form.formState.errors.hrAdminInclusiveHours && (
                        <p className="text-sm text-red-500">
                          {form.formState.errors.hrAdminInclusiveHours.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="employmentLawInclusiveHours">Employment Law Inclusive Hours</Label>
                      <div className="flex gap-2">
                        <Input
                          id="employmentLawInclusiveHours"
                          type="number"
                          step="0.01"
                          min="0"
                          {...form.register('employmentLawInclusiveHours')}
                          disabled={isSubmitting}
                          placeholder="e.g., 5"
                          className="flex-1"
                        />
                        <Select
                          value={form.watch('employmentLawInclusiveHoursPeriod')}
                          onValueChange={(value) =>
                            form.setValue('employmentLawInclusiveHoursPeriod', value as 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY')
                          }
                          disabled={isSubmitting}
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
                            disabled={isSubmitting}
                            className={`
                              flex items-center gap-2 px-3 py-2 rounded-md border text-sm
                              transition-all duration-200
                              ${
                                isSelected
                                  ? 'border-primary/50 bg-primary/5'
                                  : 'border-border hover:border-primary/30'
                              }
                              ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                            `}
                          >
                            <div
                              className={`
                                w-4 h-4 rounded border flex items-center justify-center flex-shrink-0
                                transition-all duration-200
                                ${isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30'}
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
                          disabled={isSubmitting}
                          placeholder="e.g., 75"
                          className="flex-1"
                        />
                        <Select
                          value={form.watch('hrAdminRateUnit')}
                          onValueChange={(value) => form.setValue('hrAdminRateUnit', value as 'HOURLY' | 'DAILY')}
                          disabled={isSubmitting}
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
                          disabled={isSubmitting}
                          placeholder="e.g., 150"
                          className="flex-1"
                        />
                        <Select
                          value={form.watch('employmentLawRateUnit')}
                          onValueChange={(value) =>
                            form.setValue('employmentLawRateUnit', value as 'HOURLY' | 'DAILY')
                          }
                          disabled={isSubmitting}
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
                        disabled={isSubmitting}
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
                        disabled={isSubmitting}
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
                            disabled={isSubmitting}
                            className={`
                              flex items-center gap-2 px-3 py-2 rounded-md border text-sm
                              transition-all duration-200
                              ${
                                isSelected
                                  ? 'border-primary/50 bg-primary/5'
                                  : 'border-border hover:border-primary/30'
                              }
                              ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                            `}
                          >
                            <div
                              className={`
                                w-4 h-4 rounded border flex items-center justify-center flex-shrink-0
                                transition-all duration-200
                                ${isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30'}
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

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSubmitting} className="min-w-[180px]">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Contract'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Replace Existing Contract Dialog */}
      <AlertDialog open={showReplaceDialog} onOpenChange={setShowReplaceDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Active Contract Exists</AlertDialogTitle>
            <AlertDialogDescription>
              This client already has an active contract. Would you like to replace the existing contract with this
              new one? The existing contract will be archived.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                // Create as DRAFT
                const data = form.getValues();
                createContractInternal(data, false);
              }}
            >
              No, Save as Draft
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                // Create as ACTIVE and replace
                const data = form.getValues();
                createContractInternal(data, true);
              }}
            >
              Yes, Replace Contract
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
