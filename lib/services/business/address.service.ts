import { ClientAddress, AddressType, PrismaClient } from '@prisma/client';

import { getDatabaseInstance } from '@/lib/database';
import { ValidationError } from '@/lib/errors';

interface CreateAddressDto {
  type: AddressType;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postcode: string;
  country?: string;
}

interface UpdateAddressDto {
  type?: AddressType;
  addressLine1?: string;
  addressLine2?: string | null;
  city?: string;
  postcode?: string;
  country?: string;
}

/**
 * AddressService - Business logic for address management
 */
export class AddressService {
  constructor(private readonly db: PrismaClient) {}

  /**
   * Create a new address for a client
   */
  async createAddress(clientId: number, data: CreateAddressDto): Promise<ClientAddress> {
    // Validate client ID
    if (!clientId || clientId < 1) {
      throw new ValidationError('Invalid client ID');
    }

    // Validate required fields
    if (!data.addressLine1 || !data.city || !data.postcode) {
      throw new ValidationError('Address Line 1, city, and postcode are required');
    }

    // Check if client exists
    const existingClient = await this.db.client.findUnique({
      where: { id: clientId },
    });

    if (!existingClient) {
      throw new ValidationError(`Client with ID ${clientId} not found`);
    }

    // Create the address
    const newAddress = await this.db.clientAddress.create({
      data: {
        clientId,
        type: data.type,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2 || null,
        city: data.city,
        postcode: data.postcode,
        country: data.country || 'United Kingdom',
      },
    });

    return newAddress;
  }

  /**
   * Update an address by ID
   */
  async updateAddress(addressId: number, data: UpdateAddressDto): Promise<ClientAddress> {
    // Validate address ID
    if (!addressId || addressId < 1) {
      throw new ValidationError('Invalid address ID');
    }

    // Check if address exists
    const existingAddress = await this.db.clientAddress.findUnique({
      where: { id: addressId },
    });

    if (!existingAddress) {
      throw new ValidationError(`Address with ID ${addressId} not found`);
    }

    // Update the address
    const updatedAddress = await this.db.clientAddress.update({
      where: { id: addressId },
      data: {
        ...(data.type !== undefined && { type: data.type }),
        ...(data.addressLine1 !== undefined && { addressLine1: data.addressLine1 }),
        ...(data.addressLine2 !== undefined && { addressLine2: data.addressLine2 || null }),
        ...(data.city !== undefined && { city: data.city }),
        ...(data.postcode !== undefined && { postcode: data.postcode }),
        ...(data.country !== undefined && { country: data.country }),
      },
    });

    return updatedAddress;
  }

  /**
   * Delete an address by ID
   */
  async deleteAddress(addressId: number): Promise<void> {
    // Validate address ID
    if (!addressId || addressId < 1) {
      throw new ValidationError('Invalid address ID');
    }

    // Check if address exists
    const existingAddress = await this.db.clientAddress.findUnique({
      where: { id: addressId },
    });

    if (!existingAddress) {
      throw new ValidationError(`Address with ID ${addressId} not found`);
    }

    // Delete the address
    await this.db.clientAddress.delete({
      where: { id: addressId },
    });
  }
}

// Singleton instance
const db = getDatabaseInstance();
export const addressService = new AddressService(db);
