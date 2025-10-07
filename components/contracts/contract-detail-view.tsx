'use client';

import { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { CheckCircle, ExternalLink, Save, SquarePen, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

import { updateContract } from '@/lib/actions/contract.actions';
import {
  AVAILABLE_SERVICES_IN_SCOPE,
  AVAILABLE_SERVICES_OUT_OF_SCOPE,
} from '@/lib/constants/contract';

import { DeleteContractDialog } from '@/components/contracts/delete-contract-dialog';
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

import type { Contract } from '@/lib/types/contract';

interface ContractDetailViewProps {
  contract: Contract;
  clientId: number;
  initialEditMode?: boolean;
}

/**
 * Format date for display
 */
const formatDate = (date: Date | string | null): string => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

/**
 * Contract Detail View Component
 * Displays contract details matching the style of client view "Contracts & Service" tab
 * Supports inline editing with edit/save mode toggle
 */
export function ContractDetailView({ contract, clientId, initialEditMode = false }: ContractDetailViewProps) {
  const router = useRouter();

  // Check contract status
  const isArchived = contract.status === 'ARCHIVED';
  const isDraft = contract.status === 'DRAFT';

  // Edit mode state - cannot edit archived contracts
  const [editMode, setEditMode] = useState(initialEditMode && !isArchived);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Form state
  const [contractStartDate, setContractStartDate] = useState(
    contract.contractStartDate ? new Date(contract.contractStartDate).toISOString().split('T')[0] : ''
  );
  const [contractRenewalDate, setContractRenewalDate] = useState(
    contract.contractRenewalDate ? new Date(contract.contractRenewalDate).toISOString().split('T')[0] : ''
  );
  const [docUrl, setDocUrl] = useState(contract.docUrl || '');
  const [signedContractUrl, setSignedContractUrl] = useState(contract.signedContractUrl || '');
  const [hrAdminInclusiveHours, setHrAdminInclusiveHours] = useState(
    contract.hrAdminInclusiveHours?.toString() || ''
  );
  const [employmentLawInclusiveHours, setEmploymentLawInclusiveHours] = useState(
    contract.employmentLawInclusiveHours?.toString() || ''
  );
  const [inclusiveServicesInScope, setInclusiveServicesInScope] = useState<string[]>(
    contract.inclusiveServicesInScope || []
  );
  const [inclusiveServicesOutOfScope, setInclusiveServicesOutOfScope] = useState<string[]>(
    contract.inclusiveServicesOutOfScope || []
  );
  const [hrAdminRate, setHrAdminRate] = useState(contract.hrAdminRate?.toString() || '');
  const [hrAdminRateUnit, setHrAdminRateUnit] = useState<'HOURLY' | 'DAILY'>(contract.hrAdminRateUnit || 'HOURLY');
  const [hrAdminRateNotNeeded, setHrAdminRateNotNeeded] = useState(contract.hrAdminRateNotNeeded || false);
  const [employmentLawRate, setEmploymentLawRate] = useState(contract.employmentLawRate?.toString() || '');
  const [employmentLawRateUnit, setEmploymentLawRateUnit] = useState<'HOURLY' | 'DAILY'>(contract.employmentLawRateUnit || 'HOURLY');
  const [employmentLawRateNotNeeded, setEmploymentLawRateNotNeeded] = useState(
    contract.employmentLawRateNotNeeded || false
  );
  const [mileageRate, setMileageRate] = useState(contract.mileageRate?.toString() || '');
  const [mileageRateNotNeeded, setMileageRateNotNeeded] = useState(contract.mileageRateNotNeeded || false);
  const [overnightRate, setOvernightRate] = useState(contract.overnightRate?.toString() || '');
  const [overnightRateNotNeeded, setOvernightRateNotNeeded] = useState(contract.overnightRateNotNeeded || false);

  /**
   * Toggle service in scope
   */
  const toggleServiceInScope = (service: string) => {
    setInclusiveServicesInScope((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    );
  };

  /**
   * Toggle service out of scope
   */
  const toggleServiceOutOfScope = (service: string) => {
    setInclusiveServicesOutOfScope((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    );
  };

  /**
   * Enter edit mode
   */
  const handleEnterEditMode = () => {
    setEditMode(true);
  };

  /**
   * Save all changes
   */
  const handleSave = async () => {
    setIsSaving(true);

    try {
      const result = await updateContract(contract.id, {
        contractStartDate: contractStartDate ? new Date(contractStartDate) : undefined,
        contractRenewalDate: contractRenewalDate ? new Date(contractRenewalDate) : undefined,
        docUrl: docUrl || undefined,
        signedContractUrl: signedContractUrl || undefined,
        hrAdminInclusiveHours: hrAdminInclusiveHours ? parseFloat(hrAdminInclusiveHours) : undefined,
        employmentLawInclusiveHours: employmentLawInclusiveHours
          ? parseFloat(employmentLawInclusiveHours)
          : undefined,
        inclusiveServicesInScope,
        inclusiveServicesOutOfScope,
        hrAdminRate: hrAdminRateNotNeeded ? null : hrAdminRate ? parseFloat(hrAdminRate) : undefined,
        hrAdminRateUnit: hrAdminRateNotNeeded ? null : hrAdminRateUnit,
        hrAdminRateNotNeeded,
        employmentLawRate: employmentLawRateNotNeeded
          ? null
          : employmentLawRate
            ? parseFloat(employmentLawRate)
            : undefined,
        employmentLawRateUnit: employmentLawRateNotNeeded ? null : employmentLawRateUnit,
        employmentLawRateNotNeeded,
        mileageRate: mileageRateNotNeeded ? null : mileageRate ? parseFloat(mileageRate) : undefined,
        mileageRateNotNeeded,
        overnightRate: overnightRateNotNeeded ? null : overnightRate ? parseFloat(overnightRate) : undefined,
        overnightRateNotNeeded,
      });

      if (result.success) {
        setSaveSuccess(true);
        toast.success('Contract updated successfully');

        // Return to view mode after successful save
        setTimeout(() => {
          setEditMode(false);
          setSaveSuccess(false);
          router.push(`/admin/clients/${clientId}/contracts/${contract.id}`);
          router.refresh();
        }, 500);
      } else {
        toast.error(result.error || 'Failed to update contract');
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset saveSuccess when any field changes
  useEffect(() => {
    if (saveSuccess) {
      setSaveSuccess(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    contractStartDate,
    contractRenewalDate,
    docUrl,
    signedContractUrl,
    hrAdminInclusiveHours,
    employmentLawInclusiveHours,
    inclusiveServicesInScope,
    inclusiveServicesOutOfScope,
    hrAdminRate,
    hrAdminRateUnit,
    hrAdminRateNotNeeded,
    employmentLawRate,
    employmentLawRateUnit,
    employmentLawRateNotNeeded,
    mileageRate,
    mileageRateNotNeeded,
    overnightRate,
    overnightRateNotNeeded,
  ]);

  return (
    <Card className="relative border-0">
      {/* Edit/Save Button and Delete Button */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        {/* Delete Button - Only for DRAFT contracts */}
        {isDraft && !editMode && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-700 hover:text-red-500 transition-colors"
            onClick={() => setDeleteOpen(true)}
            title="Delete Draft Contract"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}

        {/* Edit/Save Button */}
        {editMode ? (
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`h-12 w-12 flex items-center justify-center rounded transition-colors ${
              isSaving
                ? 'text-gray-400 cursor-not-allowed'
                : saveSuccess
                  ? 'text-green-500 hover:text-green-600'
                  : 'text-red-500 hover:text-green-500'
            }`}
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
            className={`h-8 w-8 transition-colors ${
              isArchived
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-green-800 hover:text-green-600'
            }`}
            onClick={handleEnterEditMode}
            disabled={isArchived}
            title={isArchived ? 'Archived contracts cannot be edited' : 'Edit Contract'}
          >
            <SquarePen className="h-4 w-4" />
          </Button>
        )}
      </div>

      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <CheckCircle className="h-5 w-5" />
          Contract and Service Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Contract Information */}
        <div>
          <h4 className="text-base font-semibold mb-4 text-primary">Contract Information</h4>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Contract Version</p>
              <p className="text-base">v{contract.version}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Contract Status</p>
              <div className="flex items-center gap-2">
                <div
                  className={`h-3 w-3 rounded-full ${
                    contract.status === 'ACTIVE'
                      ? 'bg-green-500'
                      : contract.status === 'DRAFT'
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                  }`}
                />
                <p className="text-base">
                  {contract.status.charAt(0) + contract.status.slice(1).toLowerCase()}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contractStartDate" className="text-sm font-medium text-muted-foreground">
                Contract Start Date
              </Label>
              {editMode ? (
                <Input
                  id="contractStartDate"
                  type="date"
                  value={contractStartDate}
                  onChange={(e) => setContractStartDate(e.target.value)}
                  className="h-9"
                />
              ) : (
                <p className="text-base">{formatDate(contract.contractStartDate)}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="contractRenewalDate" className="text-sm font-medium text-muted-foreground">
                Contract Renewal Date
              </Label>
              {editMode ? (
                <Input
                  id="contractRenewalDate"
                  type="date"
                  value={contractRenewalDate}
                  onChange={(e) => setContractRenewalDate(e.target.value)}
                  className="h-9"
                />
              ) : (
                <p className="text-base">{formatDate(contract.contractRenewalDate)}</p>
              )}
            </div>
          </div>
        </div>

        {/* Document URLs */}
        <div>
          <h4 className="text-base font-semibold mb-4 text-primary">Contract Documents</h4>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="docUrl" className="text-sm font-medium text-muted-foreground">
                Active Contract URL
              </Label>
              {editMode ? (
                <Input
                  id="docUrl"
                  type="url"
                  value={docUrl}
                  onChange={(e) => setDocUrl(e.target.value)}
                  placeholder="https://..."
                  className="h-9"
                />
              ) : contract.docUrl ? (
                <a
                  href={contract.docUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  Open Document <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <p className="text-base text-muted-foreground">-</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="signedContractUrl" className="text-sm font-medium text-muted-foreground">
                Signed Contract URL
              </Label>
              {editMode ? (
                <Input
                  id="signedContractUrl"
                  type="url"
                  value={signedContractUrl}
                  onChange={(e) => setSignedContractUrl(e.target.value)}
                  placeholder="https://..."
                  className="h-9"
                />
              ) : contract.signedContractUrl ? (
                <a
                  href={contract.signedContractUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  Open Document <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <p className="text-base text-muted-foreground">-</p>
              )}
            </div>
          </div>
        </div>

        {/* Service Agreement Information */}
        <div>
          <h4 className="text-base font-semibold mb-4 text-primary">Service Agreement Information</h4>
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
              <div className="grid gap-4 md:grid-cols-2 mb-6">
                <div className="space-y-2">
                  <Label htmlFor="hrAdminInclusiveHours" className="text-sm font-medium text-muted-foreground">
                    HR Admin Inclusive Hours
                  </Label>
                  {editMode ? (
                    <Input
                      id="hrAdminInclusiveHours"
                      type="number"
                      step="0.5"
                      value={hrAdminInclusiveHours}
                      onChange={(e) => setHrAdminInclusiveHours(e.target.value)}
                      placeholder="0"
                      className="h-9"
                    />
                  ) : (
                    <p className="text-base">{contract.hrAdminInclusiveHours || '-'} hours</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="employmentLawInclusiveHours"
                    className="text-sm font-medium text-muted-foreground"
                  >
                    Employment Law Inclusive Hours
                  </Label>
                  {editMode ? (
                    <Input
                      id="employmentLawInclusiveHours"
                      type="number"
                      step="0.5"
                      value={employmentLawInclusiveHours}
                      onChange={(e) => setEmploymentLawInclusiveHours(e.target.value)}
                      placeholder="0"
                      className="h-9"
                    />
                  ) : (
                    <p className="text-base">{contract.employmentLawInclusiveHours || '-'} hours</p>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-3">Inclusive Services</p>
                {editMode ? (
                  <div className="grid gap-3 md:grid-cols-3">
                    {AVAILABLE_SERVICES_IN_SCOPE.map((service) => (
                      <div
                        key={service}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer transition-colors ${
                          inclusiveServicesInScope.includes(service)
                            ? 'border-primary/50 bg-primary/5'
                            : 'border-gray-200 bg-gray-50 hover:border-primary/30'
                        } text-sm`}
                        onClick={() => toggleServiceInScope(service)}
                      >
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                            inclusiveServicesInScope.includes(service)
                              ? 'border-primary bg-primary'
                              : 'border-gray-300 bg-white'
                          }`}
                        >
                          {inclusiveServicesInScope.includes(service) && (
                            <X className="h-3 w-3 text-primary-foreground" />
                          )}
                        </div>
                        <span className="text-left">{service}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-3">
                    {contract.inclusiveServicesInScope.map((service) => (
                      <div
                        key={service}
                        className="flex items-center gap-2 px-3 py-2 rounded-md border border-primary/50 bg-primary/5 text-sm"
                      >
                        <div className="w-4 h-4 rounded border border-primary bg-primary flex items-center justify-center flex-shrink-0">
                          <X className="h-3 w-3 text-primary-foreground" />
                        </div>
                        <span className="text-left">{service}</span>
                      </div>
                    ))}
                    {contract.inclusiveServicesInScope.length === 0 && (
                      <p className="text-sm text-muted-foreground col-span-3">No services selected</p>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="out-of-scope" className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-2 mb-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">HR Admin Rate</Label>
                  {editMode ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="hrAdminRateNotNeeded"
                          checked={hrAdminRateNotNeeded}
                          onCheckedChange={(checked) => setHrAdminRateNotNeeded(checked === true)}
                        />
                        <Label htmlFor="hrAdminRateNotNeeded" className="text-sm font-normal cursor-pointer">
                          Not needed
                        </Label>
                      </div>
                      {!hrAdminRateNotNeeded && (
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            step="0.01"
                            value={hrAdminRate}
                            onChange={(e) => setHrAdminRate(e.target.value)}
                            placeholder="0.00"
                            className="h-9 flex-1"
                          />
                          <Select value={hrAdminRateUnit} onValueChange={(value) => setHrAdminRateUnit(value as 'HOURLY' | 'DAILY')}>
                            <SelectTrigger className="h-9 w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="HOURLY">Per Hour</SelectItem>
                              <SelectItem value="DAILY">Per Day</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-base">
                      {contract.hrAdminRateNotNeeded
                        ? 'Not needed'
                        : contract.hrAdminRate
                          ? `£${contract.hrAdminRate} ${contract.hrAdminRateUnit === 'HOURLY' ? 'per hour' : contract.hrAdminRateUnit === 'DAILY' ? 'per day' : ''}`
                          : '-'}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Employment Law Rate</Label>
                  {editMode ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="employmentLawRateNotNeeded"
                          checked={employmentLawRateNotNeeded}
                          onCheckedChange={(checked) => setEmploymentLawRateNotNeeded(checked === true)}
                        />
                        <Label htmlFor="employmentLawRateNotNeeded" className="text-sm font-normal cursor-pointer">
                          Not needed
                        </Label>
                      </div>
                      {!employmentLawRateNotNeeded && (
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            step="0.01"
                            value={employmentLawRate}
                            onChange={(e) => setEmploymentLawRate(e.target.value)}
                            placeholder="0.00"
                            className="h-9 flex-1"
                          />
                          <Select value={employmentLawRateUnit} onValueChange={(value) => setEmploymentLawRateUnit(value as 'HOURLY' | 'DAILY')}>
                            <SelectTrigger className="h-9 w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="HOURLY">Per Hour</SelectItem>
                              <SelectItem value="DAILY">Per Day</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-base">
                      {contract.employmentLawRateNotNeeded
                        ? 'Not needed'
                        : contract.employmentLawRate
                          ? `£${contract.employmentLawRate} ${contract.employmentLawRateUnit === 'HOURLY' ? 'per hour' : contract.employmentLawRateUnit === 'DAILY' ? 'per day' : ''}`
                          : '-'}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Mileage Rate</Label>
                  {editMode ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="mileageRateNotNeeded"
                          checked={mileageRateNotNeeded}
                          onCheckedChange={(checked) => setMileageRateNotNeeded(checked === true)}
                        />
                        <Label htmlFor="mileageRateNotNeeded" className="text-sm font-normal cursor-pointer">
                          Not needed
                        </Label>
                      </div>
                      {!mileageRateNotNeeded && (
                        <div className="flex gap-2 items-center">
                          <Input
                            type="number"
                            step="0.01"
                            value={mileageRate}
                            onChange={(e) => setMileageRate(e.target.value)}
                            placeholder="0.00"
                            className="h-9 flex-1"
                          />
                          <span className="text-sm text-muted-foreground whitespace-nowrap">per mile</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-base">
                      {contract.mileageRateNotNeeded
                        ? 'Not needed'
                        : contract.mileageRate
                          ? `£${contract.mileageRate} per mile`
                          : '-'}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Overnight Rate</Label>
                  {editMode ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="overnightRateNotNeeded"
                          checked={overnightRateNotNeeded}
                          onCheckedChange={(checked) => setOvernightRateNotNeeded(checked === true)}
                        />
                        <Label htmlFor="overnightRateNotNeeded" className="text-sm font-normal cursor-pointer">
                          Not needed
                        </Label>
                      </div>
                      {!overnightRateNotNeeded && (
                        <div className="flex gap-2 items-center">
                          <Input
                            type="number"
                            step="0.01"
                            value={overnightRate}
                            onChange={(e) => setOvernightRate(e.target.value)}
                            placeholder="0.00"
                            className="h-9 flex-1"
                          />
                          <span className="text-sm text-muted-foreground whitespace-nowrap">per night</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-base">
                      {contract.overnightRateNotNeeded
                        ? 'Not needed'
                        : contract.overnightRate
                          ? `£${contract.overnightRate} per night`
                          : '-'}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-3">Out of Scope Services</p>
                {editMode ? (
                  <div className="grid gap-3 md:grid-cols-3">
                    {AVAILABLE_SERVICES_OUT_OF_SCOPE.map((service) => (
                      <div
                        key={service}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer transition-colors ${
                          inclusiveServicesOutOfScope.includes(service)
                            ? 'border-primary/50 bg-primary/5'
                            : 'border-gray-200 bg-gray-50 hover:border-primary/30'
                        } text-sm`}
                        onClick={() => toggleServiceOutOfScope(service)}
                      >
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                            inclusiveServicesOutOfScope.includes(service)
                              ? 'border-primary bg-primary'
                              : 'border-gray-300 bg-white'
                          }`}
                        >
                          {inclusiveServicesOutOfScope.includes(service) && (
                            <X className="h-3 w-3 text-primary-foreground" />
                          )}
                        </div>
                        <span className="text-left">{service}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-3">
                    {contract.inclusiveServicesOutOfScope.map((service) => (
                      <div
                        key={service}
                        className="flex items-center gap-2 px-3 py-2 rounded-md border border-primary/50 bg-primary/5 text-sm"
                      >
                        <div className="w-4 h-4 rounded border border-primary bg-primary flex items-center justify-center flex-shrink-0">
                          <X className="h-3 w-3 text-primary-foreground" />
                        </div>
                        <span className="text-left">{service}</span>
                      </div>
                    ))}
                    {contract.inclusiveServicesOutOfScope.length === 0 && (
                      <p className="text-sm text-muted-foreground col-span-3">No services selected</p>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>

      {/* Delete Contract Dialog */}
      <DeleteContractDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        contract={contract}
        clientId={clientId}
      />
    </Card>
  );
}
