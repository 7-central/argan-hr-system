/**
 * Contract-related type definitions
 * Shared across app and business layers
 */

import type { Contract as PrismaContract, HoursPeriod } from '@prisma/client';

/**
 * Serializable Contract type for Client Components
 * Converts Prisma Decimal to number for Next.js serialization
 */
export type Contract = Omit<
  PrismaContract,
  | 'hrAdminInclusiveHours'
  | 'employmentLawInclusiveHours'
  | 'hrAdminRate'
  | 'employmentLawRate'
  | 'mileageRate'
  | 'overnightRate'
> & {
  hrAdminInclusiveHours: number | null;
  hrAdminInclusiveHoursPeriod: HoursPeriod | null;
  employmentLawInclusiveHours: number | null;
  employmentLawInclusiveHoursPeriod: HoursPeriod | null;
  hrAdminRate: number | null;
  employmentLawRate: number | null;
  mileageRate: number | null;
  overnightRate: number | null;
};

export interface CreateContractDto {
  clientId: number;
  contractStartDate: Date;
  contractRenewalDate: Date;
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  hrAdminInclusiveHours?: number;
  hrAdminInclusiveHoursPeriod?: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  employmentLawInclusiveHours?: number;
  employmentLawInclusiveHoursPeriod?: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  inclusiveServicesInScope?: string[];
  inclusiveServicesOutOfScope?: string[];
  hrAdminRate?: number;
  hrAdminRateUnit?: 'HOURLY' | 'DAILY';
  employmentLawRate?: number;
  employmentLawRateUnit?: 'HOURLY' | 'DAILY';
  mileageRate?: number;
  overnightRate?: number;
  replaceExisting?: boolean; // Whether to archive existing active contracts
}

export interface UpdateContractDto {
  contractStartDate?: Date;
  contractRenewalDate?: Date;
  status?: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  docUrl?: string | null;
  signedContractUrl?: string | null;
  hrAdminInclusiveHours?: number | null;
  hrAdminInclusiveHoursPeriod?: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | null;
  employmentLawInclusiveHours?: number | null;
  employmentLawInclusiveHoursPeriod?: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | null;
  inclusiveServicesInScope?: string[];
  inclusiveServicesOutOfScope?: string[];
  hrAdminRate?: number | null;
  hrAdminRateUnit?: 'HOURLY' | 'DAILY' | null;
  hrAdminRateNotNeeded?: boolean;
  employmentLawRate?: number | null;
  employmentLawRateUnit?: 'HOURLY' | 'DAILY' | null;
  employmentLawRateNotNeeded?: boolean;
  mileageRate?: number | null;
  mileageRateNotNeeded?: boolean;
  overnightRate?: number | null;
  overnightRateNotNeeded?: boolean;
}
