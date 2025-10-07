/**
 * Client-related type definitions
 * Shared across app and business layers
 */

import type { Client as PrismaClient } from '@prisma/client';

/**
 * Serializable Client type for Client Components
 * Converts Prisma Decimal to number for Next.js serialization
 */
export type Client = Omit<PrismaClient, 'monthlyRetainer'> & {
  monthlyRetainer: number | null;
};

export interface GetClientsParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface CreateClientDto {
  companyName: string;
  businessId?: string;
  sector?: string;
  serviceTier: 'TIER_1' | 'DOC_ONLY' | 'AD_HOC';
  monthlyRetainer?: number;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  contactRole?: string;
  secondaryContactName?: string;
  secondaryContactEmail?: string;
  secondaryContactPhone?: string;
  secondaryContactRole?: string;
  invoiceContactName?: string;
  invoiceContactEmail?: string;
  invoiceContactPhone?: string;
  invoiceContactRole?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postcode?: string;
  country?: string;
  contractStartDate?: Date;
  contractRenewalDate?: Date;
  status?: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  externalAudit?: boolean;
  auditRecords?: Array<{
    auditedBy: string;
    auditInterval: 'QUARTERLY' | 'ANNUALLY' | 'TWO_YEARS' | 'THREE_YEARS' | 'FIVE_YEARS';
    nextAuditDate: Date;
  }>;
  // Legacy single audit fields (deprecated - use auditRecords instead)
  auditedBy?: string;
  auditInterval?: 'QUARTERLY' | 'ANNUALLY' | 'TWO_YEARS' | 'THREE_YEARS' | 'FIVE_YEARS';
  nextAuditDate?: Date;
  paymentMethod?: 'INVOICE' | 'DIRECT_DEBIT';
  // Contract Service Agreement fields
  hrAdminInclusiveHours?: number;
  employmentLawInclusiveHours?: number;
  inclusiveServicesInScope?: string[];
  inclusiveServicesOutOfScope?: string[];
  hrAdminRate?: number;
  hrAdminRateUnit?: 'HOURLY' | 'DAILY';
  employmentLawRate?: number;
  employmentLawRateUnit?: 'HOURLY' | 'DAILY';
  mileageRate?: number;
  overnightRate?: number;
}

export interface UpdateClientDto {
  companyName?: string;
  businessId?: string;
  sector?: string;
  serviceTier?: 'TIER_1' | 'DOC_ONLY' | 'AD_HOC';
  monthlyRetainer?: number;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactRole?: string;
  secondaryContactName?: string;
  secondaryContactEmail?: string;
  secondaryContactPhone?: string;
  secondaryContactRole?: string;
  invoiceContactName?: string;
  invoiceContactEmail?: string;
  invoiceContactPhone?: string;
  invoiceContactRole?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postcode?: string;
  country?: string;
  contractStartDate?: Date;
  contractRenewalDate?: Date;
  status?: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  externalAudit?: boolean;
  auditedBy?: string;
  auditInterval?: 'QUARTERLY' | 'ANNUALLY' | 'TWO_YEARS' | 'THREE_YEARS' | 'FIVE_YEARS';
  nextAuditDate?: Date;
  paymentMethod?: 'INVOICE' | 'DIRECT_DEBIT';
  directDebitSetup?: boolean;
  directDebitConfirmed?: boolean;
  contractAddedToXero?: boolean;
  recurringInvoiceSetup?: boolean;
  dpaSignedGdpr?: boolean;
  firstInvoiceSent?: boolean;
  firstPaymentMade?: boolean;
  lastPriceIncrease?: Date;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ClientResponse {
  clients: PrismaClient[]; // Internal use - returns Prisma clients with Decimal
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Serializable version for Client Components
export interface SerializableClientResponse {
  clients: Client[]; // Serializable clients with number
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
