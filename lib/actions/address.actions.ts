'use server';

import { revalidatePath } from 'next/cache';

import { AddressType, ClientAddress } from '@prisma/client';

import { withAuth } from '@/lib/server-actions/with-auth';
import { addressService } from '@/lib/services/business/address.service';

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
 * Create a new address for a client
 */
export const createAddress = withAuth(
  async (
    _session,
    clientId: number,
    data: CreateAddressDto
  ): Promise<{ success: boolean; error?: string; address?: ClientAddress }> => {
    try {
      const newAddress = await addressService.createAddress(clientId, data);

      // Revalidate the client page to show new address
      revalidatePath('/admin/clients');

      return {
        success: true,
        address: newAddress,
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
        error: 'An unexpected error occurred while creating the address',
      };
    }
  }
);

/**
 * Update an address
 */
export const updateAddress = withAuth(
  async (
    _session,
    addressId: number,
    data: UpdateAddressDto
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await addressService.updateAddress(addressId, data);

      // Revalidate the client page to show updated address
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
        error: 'An unexpected error occurred while updating the address',
      };
    }
  }
);

/**
 * Delete an address
 */
export const deleteAddress = withAuth(
  async (
    _session,
    addressId: number
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await addressService.deleteAddress(addressId);

      // Revalidate the client page to show updated address list
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
        error: 'An unexpected error occurred while deleting the address',
      };
    }
  }
);
