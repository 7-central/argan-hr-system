'use server';

import { revalidatePath } from 'next/cache';

import { withAuth } from '@/lib/server-actions/with-auth';
import { contactService } from '@/lib/services/business/contact.service';

interface UpdateContactDto {
  name?: string;
  email?: string;
  phone?: string | null;
  role?: string | null;
}

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
