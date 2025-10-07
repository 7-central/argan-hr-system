'use client';

import { useState, useEffect, useCallback } from 'react';

import { Loader2, CheckCircle2 } from 'lucide-react';

import { getOnboarding, updateOnboardingField } from '@/lib/actions/client.actions';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface OnboardingData {
  client: {
    id: number;
    companyName: string;
    welcomeEmailSent: boolean;
    paymentMethod: string | null;
    directDebitSetup: boolean | null;
    directDebitConfirmed: boolean | null;
    contractAddedToXero: boolean;
    recurringInvoiceSetup: boolean | null;
    dpaSignedGdpr: boolean;
    firstInvoiceSent: boolean;
    firstPaymentMade: boolean;
  };
  contract: {
    id: number;
    contractNumber: string;
    signedContractReceived: boolean;
    contractUploaded: boolean;
    contractSentToClient: boolean;
    paymentTermsAgreed: boolean;
    outOfScopeRateAgreed: boolean;
  } | null;
}

interface OnboardingModalProps {
  clientId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OnboardingModal({ clientId, open, onOpenChange }: OnboardingModalProps) {
  const [data, setData] = useState<OnboardingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOnboardingData = useCallback(async () => {
    if (!clientId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getOnboarding(clientId);

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch onboarding data');
      }

      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load onboarding data');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  // Fetch onboarding data when modal opens
  useEffect(() => {
    if (open && clientId) {
      fetchOnboardingData();
    }
  }, [open, clientId, fetchOnboardingData]);

  const updateField = async (
    type: 'client' | 'contract',
    field: string,
    value: boolean
  ) => {
    if (!data || !clientId) return;

    setSaving(true);
    setError(null);

    try {
      const result = await updateOnboardingField(clientId, type, field, value);

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to update onboarding field');
      }

      // Update local state
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update field');
    } finally {
      setSaving(false);
    }
  };

  const calculateProgress = () => {
    if (!data) return { completed: 0, total: 0, percentage: 0 };

    // Client onboarding fields (payment infrastructure is now at client level)
    // Only include fields that are not null (N/A)
    const clientFields = [
      data.client.welcomeEmailSent,
      data.client.directDebitSetup,
      data.client.directDebitConfirmed,
      data.client.contractAddedToXero,
      data.client.dpaSignedGdpr,
      data.client.firstInvoiceSent,
      data.client.firstPaymentMade,
      data.client.recurringInvoiceSetup,
    ].filter((field) => field !== null); // Exclude N/A fields from progress

    // Contract onboarding fields (contract-specific items only)
    const contractFields = data.contract
      ? [
          data.contract.signedContractReceived,
          data.contract.contractUploaded,
          data.contract.contractSentToClient,
          data.contract.paymentTermsAgreed,
          data.contract.outOfScopeRateAgreed,
        ]
      : [];

    const allFields = [...clientFields, ...contractFields];
    const completed = allFields.filter(Boolean).length;
    const total = allFields.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, total, percentage };
  };

  const progress = calculateProgress();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {data ? `Onboarding Checklist - ${data.client.companyName}` : 'Onboarding Checklist'}
          </DialogTitle>
          <DialogDescription>
            Track client and contract onboarding progress
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : data ? (
          <>
            {/* Progress Bar */}
            <div className="space-y-2 pb-4 border-b">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Overall Progress</span>
                <span className="text-muted-foreground">
                  {progress.completed} of {progress.total} completed
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-600 transition-all duration-300"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
            </div>

            {/* Two-column layout */}
            <div className="grid md:grid-cols-2 gap-6 py-4">
              {/* Client Onboarding */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold">Client Onboarding</h3>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="welcomeEmailSent"
                      checked={data.client.welcomeEmailSent}
                      onCheckedChange={(checked) =>
                        updateField('client', 'welcomeEmailSent', checked === true)
                      }
                      disabled={saving}
                    />
                    <Label
                      htmlFor="welcomeEmailSent"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Welcome email sent
                    </Label>
                  </div>

                  {/* Only show direct debit fields if payment method is DIRECT_DEBIT */}
                  {data.client.directDebitSetup !== null && (
                    <>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="directDebitSetup"
                          checked={data.client.directDebitSetup || false}
                          onCheckedChange={(checked) =>
                            updateField('client', 'directDebitSetup', checked === true)
                          }
                          disabled={saving}
                        />
                        <Label
                          htmlFor="directDebitSetup"
                          className="text-sm font-normal cursor-pointer"
                        >
                          Direct debit setup
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="directDebitConfirmed"
                          checked={data.client.directDebitConfirmed || false}
                          onCheckedChange={(checked) =>
                            updateField('client', 'directDebitConfirmed', checked === true)
                          }
                          disabled={saving}
                        />
                        <Label
                          htmlFor="directDebitConfirmed"
                          className="text-sm font-normal cursor-pointer"
                        >
                          Direct debit confirmed
                        </Label>
                      </div>
                    </>
                  )}

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="contractAddedToXero"
                      checked={data.client.contractAddedToXero}
                      onCheckedChange={(checked) =>
                        updateField('client', 'contractAddedToXero', checked === true)
                      }
                      disabled={saving}
                    />
                    <Label
                      htmlFor="contractAddedToXero"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Added to Xero
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="dpaSignedGdpr"
                      checked={data.client.dpaSignedGdpr}
                      onCheckedChange={(checked) =>
                        updateField('client', 'dpaSignedGdpr', checked === true)
                      }
                      disabled={saving}
                    />
                    <Label
                      htmlFor="dpaSignedGdpr"
                      className="text-sm font-normal cursor-pointer"
                    >
                      DPA signed (GDPR)
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="firstInvoiceSent"
                      checked={data.client.firstInvoiceSent}
                      onCheckedChange={(checked) =>
                        updateField('client', 'firstInvoiceSent', checked === true)
                      }
                      disabled={saving}
                    />
                    <Label
                      htmlFor="firstInvoiceSent"
                      className="text-sm font-normal cursor-pointer"
                    >
                      First invoice sent
                    </Label>
                  </div>

                  {/* Only show recurring invoice setup if payment method is INVOICE */}
                  {data.client.recurringInvoiceSetup !== null && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="recurringInvoiceSetup"
                        checked={data.client.recurringInvoiceSetup || false}
                        onCheckedChange={(checked) =>
                          updateField('client', 'recurringInvoiceSetup', checked === true)
                        }
                        disabled={saving}
                      />
                      <Label
                        htmlFor="recurringInvoiceSetup"
                        className="text-sm font-normal cursor-pointer"
                      >
                        Recurring invoice setup
                      </Label>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="firstPaymentMade"
                      checked={data.client.firstPaymentMade}
                      onCheckedChange={(checked) =>
                        updateField('client', 'firstPaymentMade', checked === true)
                      }
                      disabled={saving}
                    />
                    <Label
                      htmlFor="firstPaymentMade"
                      className="text-sm font-normal cursor-pointer"
                    >
                      First payment made
                    </Label>
                  </div>
                </div>
              </div>

              {/* Contract Onboarding */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold">Contract Onboarding</h3>
                </div>

                {data.contract ? (
                  <>
                    <p className="text-xs text-muted-foreground">
                      Contract: {data.contract.contractNumber}
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="contractUploaded"
                          checked={data.contract.contractUploaded}
                          onCheckedChange={(checked) =>
                            updateField('contract', 'contractUploaded', checked === true)
                          }
                          disabled={saving}
                        />
                        <Label
                          htmlFor="contractUploaded"
                          className="text-sm font-normal cursor-pointer"
                        >
                          Contract uploaded
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="contractSentToClient"
                          checked={data.contract.contractSentToClient}
                          onCheckedChange={(checked) =>
                            updateField('contract', 'contractSentToClient', checked === true)
                          }
                          disabled={saving}
                        />
                        <Label
                          htmlFor="contractSentToClient"
                          className="text-sm font-normal cursor-pointer"
                        >
                          Contract sent to client
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="signedContractReceived"
                          checked={data.contract.signedContractReceived}
                          onCheckedChange={(checked) =>
                            updateField('contract', 'signedContractReceived', checked === true)
                          }
                          disabled={saving}
                        />
                        <Label
                          htmlFor="signedContractReceived"
                          className="text-sm font-normal cursor-pointer"
                        >
                          Signed contract received
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="paymentTermsAgreed"
                          checked={data.contract.paymentTermsAgreed}
                          onCheckedChange={(checked) =>
                            updateField('contract', 'paymentTermsAgreed', checked === true)
                          }
                          disabled={saving}
                        />
                        <Label
                          htmlFor="paymentTermsAgreed"
                          className="text-sm font-normal cursor-pointer"
                        >
                          Payment terms agreed
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="outOfScopeRateAgreed"
                          checked={data.contract.outOfScopeRateAgreed}
                          onCheckedChange={(checked) =>
                            updateField('contract', 'outOfScopeRateAgreed', checked === true)
                          }
                          disabled={saving}
                        />
                        <Label
                          htmlFor="outOfScopeRateAgreed"
                          className="text-sm font-normal cursor-pointer"
                        >
                          Out of scope rate agreed
                        </Label>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No active contract found</p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button onClick={() => onOpenChange(false)}>Close</Button>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
