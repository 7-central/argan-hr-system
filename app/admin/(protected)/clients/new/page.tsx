'use client';

// Force dynamic rendering for sidebar context
export const dynamic = 'force-dynamic';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { ClientForm } from '@/components/forms/client-form';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

import { createClient } from '../actions';

import type { OptimisticClientResponse } from '@/lib/hooks/useOptimisticClient';
import type { Client, CreateClientDto } from '@/lib/types/client';

/**
 * New Client Page
 * Provides client creation with Server Actions following architectural patterns
 *
 * Features:
 * - Server Action for data mutation
 * - Error handling with form data preservation
 * - Proper success feedback and navigation
 * - Follows architectural principles for data flow
 */
export default function NewClientPage() {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  /**
   * Handle client creation using Server Action
   * Provides proper error handling following architectural patterns
   */
  const handleCreateClient = async (
    data: CreateClientDto
  ): Promise<OptimisticClientResponse<Client>> => {
    const result = await createClient(data);

    if (result.success && result.data) {
      // Success! Start redirect process
      setIsRedirecting(true);

      // Navigate back to client list with a brief delay for user feedback
      setTimeout(() => {
        router.push('/admin/clients');
        router.refresh(); // Refresh to show new client in list
      }, 1000);

      return {
        success: true,
        data: result.data,
      };
    }

    // Return error result for form handling
    return {
      success: false,
      error: result.error || 'Failed to create client',
    };
  };

  /**
   * Handle form cancellation
   * Navigate back to clients list
   */
  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="flex flex-1 flex-col">
      {/* Page Header */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin/clients">Clients</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>New Client</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      {/* Page Content */}
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="mx-auto w-full max-w-4xl">
          <ClientForm
            onSubmit={handleCreateClient}
            onCancel={handleCancel}
            isLoading={isRedirecting}
          />
        </div>
      </div>
    </div>
  );
}
