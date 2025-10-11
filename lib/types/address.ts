/**
 * Address-related type definitions
 * Shared across app and business layers
 */

import type { AddressType } from '@prisma/client';

/**
 * Address input for creating new addresses
 */
export interface AddressInput {
  type: AddressType; // 'SERVICE' or 'INVOICE'
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postcode: string;
  country: string;
  description?: string;
}

/**
 * Serializable Address type for Client Components
 */
export interface Address {
  id: number;
  clientId: number;
  type: AddressType;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  postcode: string;
  country: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}
