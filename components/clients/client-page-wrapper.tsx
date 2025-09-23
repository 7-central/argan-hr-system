'use client'

import { useRouter } from 'next/navigation'
import { OptimisticClientList } from './optimistic-client-list'
import type { Client } from '@prisma/client'

/**
 * Props for the ClientPageWrapper component
 */
export interface ClientPageWrapperProps {
  /** Initial client data from server */
  clients: Client[]
  /** Current search term */
  search?: string
}

/**
 * Client Page Wrapper Component
 * Wraps the optimistic client list with navigation handling
 *
 * This component provides the bridge between the server-rendered page
 * and the client-side optimistic updates functionality
 */
export function ClientPageWrapper({ clients, search }: ClientPageWrapperProps) {
  const router = useRouter()

  /**
   * Handle client edit navigation
   * Navigate to edit page for the selected client
   */
  const handleEdit = (client: Client) => {
    router.push(`/admin/clients/${client.id}/edit`)
  }

  /**
   * Handle client view navigation
   * Navigate to detail view for the selected client
   */
  const handleView = (client: Client) => {
    router.push(`/admin/clients/${client.id}`)
  }

  return (
    <OptimisticClientList
      clients={clients}
      search={search}
      onEdit={handleEdit}
      onView={handleView}
    />
  )
}