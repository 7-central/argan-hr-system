'use client';

import { useState } from 'react';

import { EditAdminDialog } from './edit-admin-dialog';
import { OptimisticAdminList } from './optimistic-admin-list';

import type { ServerActionResult } from '@/lib/types/action';
import type { SerializableAdmin, AdminRole } from '@/lib/types/admin';

/**
 * Props for the AdminPageWrapper component
 */
export interface AdminPageWrapperProps {
  /** Initial admin data from server */
  admins: SerializableAdmin[];
  /** Current session user role */
  currentUserRole: AdminRole;
  /** Current search term */
  search?: string;
  /** Server Action for deleting users */
  deleteUserAction: (id: string) => Promise<ServerActionResult<unknown>>;
  /** Server Action for reactivating users */
  reactivateUserAction: (id: string) => Promise<ServerActionResult<unknown>>;
}

/**
 * Admin Page Wrapper Component
 * Wraps the optimistic admin list with dialog management
 *
 * This component provides the bridge between the server-rendered page
 * and the client-side optimistic updates functionality, managing create/edit dialogs
 * Uses dependency injection to pass Server Actions down to hooks (proper layer separation)
 */
export function AdminPageWrapper({
  admins,
  currentUserRole,
  search,
  deleteUserAction,
  reactivateUserAction,
}: AdminPageWrapperProps) {
  const [editingAdmin, setEditingAdmin] = useState<SerializableAdmin | null>(null);

  /**
   * Handle admin edit action
   * Opens the edit dialog with the selected admin
   */
  const handleEdit = (admin: SerializableAdmin) => {
    setEditingAdmin(admin);
  };

  return (
    <>
      <OptimisticAdminList
        admins={admins}
        currentUserRole={currentUserRole}
        search={search}
        onEdit={handleEdit}
        deleteUserAction={deleteUserAction}
        reactivateUserAction={reactivateUserAction}
      />

      {/* Edit Admin Dialog */}
      <EditAdminDialog
        admin={editingAdmin}
        open={!!editingAdmin}
        onOpenChange={(open) => !open && setEditingAdmin(null)}
      />
    </>
  );
}
