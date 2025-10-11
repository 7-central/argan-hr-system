'use server';

import { revalidatePath } from 'next/cache';

import { ContactType } from '@prisma/client';

import { withAuth } from '@/lib/server-actions/with-auth';
import { contactService } from '@/lib/services/business/contact.service';

import type { Contact } from '@/lib/types/contact';

interface UpdateContactDto {
  name?: string;
  email?: string;
  phone?: string | null;
  role?: string | null;
}

interface CreateContactDto {
  type: ContactType;
  name: string;
  email: string;
  phone?: string;
  role?: string;
}

/**
 * Create a new contact for a client
 */
export const createContact = withAuth(
  async (
    _session,
    clientId: number,
    data: CreateContactDto
  ): Promise<{ success: boolean; error?: string; contact?: Contact }> => {
    try {
      const newContact = await contactService.createContact(clientId, data);

      // Revalidate the client page to show new contact
      revalidatePath('/admin/clients');

      return {
        success: true,
        contact: newContact,
      };
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: false,
        error: 'An unexpected error occurred while creating the contact',
      };
    }
  }
);

/**
 * Update a contact
 */
export const updateContact = withAuth(
  async (
    _session,
    contactId: number,
    data: UpdateContactDto
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await contactService.updateContact(contactId, data);

      // Revalidate the client page to show updated contact
      revalidatePath('/admin/clients');

      return { success: true };
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: false,
        error: 'An unexpected error occurred while updating the contact',
      };
    }
  }
);

/**
 * Delete a contact
 */
export const deleteContact = withAuth(
  async (
    _session,
    contactId: number
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await contactService.deleteContact(contactId);

      // Revalidate the client page to show updated contact list
      revalidatePath('/admin/clients');

      return { success: true };
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: false,
        error: 'An unexpected error occurred while deleting the contact',
      };
    }
  }
);
