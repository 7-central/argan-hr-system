/**
 * Contact-related type definitions
 * Shared across app and business layers
 */

import type { ContactType } from '@prisma/client';

/**
 * Contact input for creating new contacts
 */
export interface ContactInput {
  type: ContactType; // 'SERVICE' or 'INVOICE'
  name: string;
  email: string;
  phone?: string;
  role?: string;
  description?: string;
}

/**
 * Serializable Contact type for Client Components
 */
export interface Contact {
  id: number;
  clientId: number;
  type: ContactType;
  name: string;
  email: string;
  phone: string | null;
  role: string | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}
