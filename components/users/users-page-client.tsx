'use client';

import { useState } from 'react';

import { UserPlus } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { CreateAdminDialog } from './create-admin-dialog';


/**
 * Props for UsersPageClient
 */
export interface UsersPageClientProps {
  isSuperAdmin: boolean;
}

/**
 * Users Page Client Component
 * Manages the "Add Admin" button and create dialog state
 */
export function UsersPageClient({ isSuperAdmin: canManageAdmins }: UsersPageClientProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <>
      <Button
        disabled={!canManageAdmins}
        title={!canManageAdmins ? 'Only SUPER_ADMIN and ADMIN can add users' : ''}
        onClick={() => setCreateDialogOpen(true)}
        className="w-[180px]"
      >
        <UserPlus className="mr-2 h-4 w-4" />
        Add New Admin
      </Button>

      {/* Create Admin Dialog */}
      <CreateAdminDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </>
  );
}
