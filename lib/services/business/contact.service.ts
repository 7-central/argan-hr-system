import { ClientContact, PrismaClient } from '@prisma/client';

import { getDatabaseInstance } from '@/lib/database';
import { ValidationError } from '@/lib/errors';

interface UpdateContactDto {
  name?: string;
  email?: string;
  phone?: string | null;
  role?: string | null;
}

/**
 * ContactService - Business logic for contact management
 */
export class ContactService {
  constructor(private readonly db: PrismaClient) {}

  /**
   * Update a contact by ID
   */
  async updateContact(contactId: number, data: UpdateContactDto): Promise<ClientContact> {
    // Validate contact ID
    if (!contactId || contactId < 1) {
      throw new ValidationError('Invalid contact ID');
    }

    // Validate email if provided
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      throw new ValidationError('Invalid email format');
    }

    // Check if contact exists
    const existingContact = await this.db.clientContact.findUnique({
      where: { id: contactId },
    });

    if (!existingContact) {
      throw new ValidationError(`Contact with ID ${contactId} not found`);
    }

    // Update the contact
    const updatedContact = await this.db.clientContact.update({
      where: { id: contactId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone || null }),
        ...(data.role !== undefined && { role: data.role || null }),
      },
    });

    return updatedContact;
  }
}

// Singleton instance
const db = getDatabaseInstance();
export const contactService = new ContactService(db);
