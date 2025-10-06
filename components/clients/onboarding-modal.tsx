'use client';

import { useState, useEffect, useCallback } from 'react';

import { Loader2, CheckCircle2 } from 'lucide-react';

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
  };
  contract: {
    id: number;
    contractNumber: string;
    directDebitSetup: boolean;
    directDebitConfirmed: boolean;
    signedContractReceived: boolean;
    contractUploaded: boolean;
    contractAddedToXero: boolean;
    contractSentToClient: boolean;
    dpaSignedGdpr: boolean;
    firstInvoiceSent: boolean;
    firstPaymentMade: boolean;
    paymentTermsAgreed: boolean;
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
      const response = await fetch(`/api/clients/${clientId}/onboarding`);
      const result = await response.json();

      if (!response.ok || !result.success) {
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
      const response = await fetch(`/api/clients/${clientId}/onboarding`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          field,
          value,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
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

    // Client onboarding fields (includes some contract fields displayed in client section)
    const clientFields = data.contract
      ? [
          data.client.welcomeEmailSent,
          data.contract.directDebitSetup,
          data.contract.directDebitConfirmed,
          data.contract.contractAddedToXero,
          data.contract.dpaSignedGdpr,
          data.contract.firstInvoiceSent,
          data.contract.firstPaymentMade,
        ]
      : [data.client.welcomeEmailSent];

    // Contract onboarding fields
    const contractFields = data.contract
      ? [
          data.contract.signedContractReceived,
          data.contract.contractUploaded,
          data.contract.contractSentToClient,
          data.contract.paymentTermsAgreed,
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

                  {data.contract && (
                    <>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="directDebitSetup"
                          checked={data.contract.directDebitSetup}
                          onCheckedChange={(checked) =>
                            updateField('contract', 'directDebitSetup', checked === true)
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
                          checked={data.contract.directDebitConfirmed}
                          onCheckedChange={(checked) =>
                            updateField('contract', 'directDebitConfirmed', checked === true)
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

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="contractAddedToXero"
                          checked={data.contract.contractAddedToXero}
                          onCheckedChange={(checked) =>
                            updateField('contract', 'contractAddedToXero', checked === true)
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
                          checked={data.contract.dpaSignedGdpr}
                          onCheckedChange={(checked) =>
                            updateField('contract', 'dpaSignedGdpr', checked === true)
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
                          checked={data.contract.firstInvoiceSent}
                          onCheckedChange={(checked) =>
                            updateField('contract', 'firstInvoiceSent', checked === true)
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

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="firstPaymentMade"
                          checked={data.contract.firstPaymentMade}
                          onCheckedChange={(checked) =>
                            updateField('contract', 'firstPaymentMade', checked === true)
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
                    </>
                  )}
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
