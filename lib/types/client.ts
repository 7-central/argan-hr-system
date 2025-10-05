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
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postcode?: string;
  country?: string;
  contractStartDate?: Date;
  contractRenewalDate?: Date;
  status?: 'ACTIVE' | 'INACTIVE' | 'PENDING';
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
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postcode?: string;
  country?: string;
  contractStartDate?: Date;
  contractRenewalDate?: Date;
  status?: 'ACTIVE' | 'INACTIVE' | 'PENDING';
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
