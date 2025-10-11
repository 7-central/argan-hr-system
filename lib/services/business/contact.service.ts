import { ClientContact, ContactType, PrismaClient } from '@prisma/client';

import { getDatabaseInstance } from '@/lib/database';
import { ValidationError } from '@/lib/errors';

interface CreateContactDto {
  type: ContactType;
  name: string;
  email: string;
  phone?: string;
  role?: string;
}

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
   * Create a new contact for a client
   */
  async createContact(clientId: number, data: CreateContactDto): Promise<ClientContact> {
    // Validate client ID
    if (!clientId || clientId < 1) {
      throw new ValidationError('Invalid client ID');
    }

    // Validate required fields
    if (!data.name || !data.email) {
      throw new ValidationError('Name and email are required');
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      throw new ValidationError('Invalid email format');
    }

    // Check if client exists
    const existingClient = await this.db.client.findUnique({
      where: { id: clientId },
    });

    if (!existingClient) {
      throw new ValidationError(`Client with ID ${clientId} not found`);
    }

    // Create the contact
    const newContact = await this.db.clientContact.create({
      data: {
        clientId,
        type: data.type,
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        role: data.role || null,
      },
    });

    return newContact;
  }

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

  /**
   * Delete a contact by ID
   */
  async deleteContact(contactId: number): Promise<void> {
    // Validate contact ID
    if (!contactId || contactId < 1) {
      throw new ValidationError('Invalid contact ID');
    }

    // Check if contact exists
    const existingContact = await this.db.clientContact.findUnique({
      where: { id: contactId },
    });

    if (!existingContact) {
      throw new ValidationError(`Contact with ID ${contactId} not found`);
    }

    // Delete the contact
    await this.db.clientContact.delete({
      where: { id: contactId },
    });
  }
}

// Singleton instance
const db = getDatabaseInstance();
export const contactService = new ContactService(db);
