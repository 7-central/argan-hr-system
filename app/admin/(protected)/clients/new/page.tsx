'use client';

// Force dynamic rendering for sidebar context
export const dynamic = 'force-dynamic';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { useOptimisticClient } from '@/lib/hooks/useOptimisticClient';

import { ClientForm } from '@/components/forms/client-form';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

import type { CreateClientDto } from '../actions';
import type { OptimisticClientResponse } from '@/lib/hooks/useOptimisticClient';
import type { Client } from '@prisma/client';

/**
 * New Client Page
 * Provides optimistic client creation with immediate feedback
 *
 * Features:
 * - Optimistic form submission with instant UI updates
 * - Error handling with form data preservation
 * - Integration with loading states from Story 2.1
 * - Smooth navigation and user feedback
 */
export default function NewClientPage() {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Initialize optimistic client hook with empty array
  const { createClientOptimistic } = useOptimisticClient([]);

  /**
   * Handle optimistic client creation
   * Provides immediate feedback and smooth error handling
   */
  const handleCreateClient = async (
    data: CreateClientDto
  ): Promise<OptimisticClientResponse<Client>> => {
    const result = await createClientOptimistic(data);

    if (result.success) {
      // Success! Start redirect process
      setIsRedirecting(true);

      // Navigate back to client list with a brief delay for user feedback
      setTimeout(() => {
        router.push('/admin/clients');
      }, 1000);
    }

    // Return result for form handling (error display, etc.)
    return result;
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
