'use client';

import { useState, useMemo } from 'react';

import { Edit, UserX, UserCheck, MoreHorizontal, Loader2, AlertCircle, Clock, Shield, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

import { useOptimisticAdmin } from '@/lib/hooks/useOptimisticAdmin';

import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import type { OptimisticAdmin } from '@/lib/hooks/useOptimisticAdmin';
import type { ServerActionResult } from '@/lib/types/action';
import type { SerializableAdmin, AdminRole } from '@/lib/types/admin';

/**
 * Props for the OptimisticAdminList component
 */
export interface OptimisticAdminListProps {
  /** Initial admin data from server */
  admins: SerializableAdmin[];
  /** Current session user role */
  currentUserRole: AdminRole;
  /** Search term for filtering results */
  search?: string;
  /** Callback when edit action is triggered */
  onEdit?: (admin: SerializableAdmin) => void;
  /** Server Action for deleting users */
  deleteUserAction: (id: string) => Promise<ServerActionResult<unknown>>;
  /** Server Action for reactivating users */
  reactivateUserAction: (id: string) => Promise<ServerActionResult<unknown>>;
}

/**
 * Optimistic Admin List Component
 * Provides immediate feedback for admin user operations with smooth error handling
 *
 * Features:
 * - Optimistic deactivate/reactivate operations with instant visual feedback
 * - Pending state indicators for operations in progress
 * - Error state handling with rollback capability
 * - Role-based action visibility (only SUPER_ADMIN can manage)
 * - Smooth animations for state transitions
 */
export function OptimisticAdminList({
  admins,
  currentUserRole,
  search = '',
  onEdit,
  deleteUserAction,
  reactivateUserAction,
}: OptimisticAdminListProps) {
  const [adminToDeactivate, setAdminToDeactivate] = useState<SerializableAdmin | null>(null);
  const [adminToReactivate, setAdminToReactivate] = useState<SerializableAdmin | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<'name' | 'email' | 'role' | 'isActive' | 'createdAt' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Initialize optimistic admin management with injected Server Actions
  const { optimisticAdmins: rawOptimisticAdmins, deleteAdminOptimistic, reactivateAdminOptimistic } =
    useOptimisticAdmin(admins, deleteUserAction, reactivateUserAction);

  // Check if current user can manage admin users (SUPER_ADMIN or ADMIN)
  const canManageAdmins = currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'ADMIN';

  // Handle column header click for sorting
  const handleSort = (column: 'name' | 'email' | 'role' | 'isActive' | 'createdAt') => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to ascending
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Sort the optimistic admins based on current sort settings
  const optimisticAdmins = useMemo(() => {
    return [...rawOptimisticAdmins].sort((a, b) => {
      // Default sort: Active status first, then role, then alphabetically by name
      if (sortColumn === null) {
        // 1. Sort by active status (active first)
        if (a.isActive !== b.isActive) {
          return a.isActive ? -1 : 1;
        }

        // 2. Sort by role (SUPER_ADMIN > ADMIN > READ_ONLY)
        const roleOrder = { SUPER_ADMIN: 0, ADMIN: 1, READ_ONLY: 2 };
        const aRoleOrder = roleOrder[a.role];
        const bRoleOrder = roleOrder[b.role];
        if (aRoleOrder !== bRoleOrder) {
          return aRoleOrder - bRoleOrder;
        }

        // 3. Sort alphabetically by name
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      }

      // Single column sort when user clicks a header
      let aVal: string | number | boolean = '';
      let bVal: string | number | boolean = '';

      switch (sortColumn) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'email':
          aVal = a.email.toLowerCase();
          bVal = b.email.toLowerCase();
          break;
        case 'role':
          aVal = a.role;
          bVal = b.role;
          break;
        case 'isActive':
          aVal = a.isActive ? 1 : 0;
          bVal = b.isActive ? 1 : 0;
          break;
        case 'createdAt':
          aVal = new Date(a.createdAt).getTime();
          bVal = new Date(b.createdAt).getTime();
          break;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [rawOptimisticAdmins, sortColumn, sortDirection]);

  /**
   * Handle optimistic admin deactivation
   */
  const handleDeactivateAdmin = async (admin: SerializableAdmin) => {
    setError(null);

    const result = await deleteAdminOptimistic(admin.id);

    if (!result.success) {
      setError(result.error || 'Failed to deactivate admin user');
    }

    setAdminToDeactivate(null);
  };

  /**
   * Handle optimistic admin reactivation
   */
  const handleReactivateAdmin = async (admin: SerializableAdmin) => {
    setError(null);

    const result = await reactivateAdminOptimistic(admin.id);

    if (!result.success) {
      setError(result.error || 'Failed to reactivate admin user');
    }

    setAdminToReactivate(null);
  };

  /**
   * Get role badge variant
   */
  function getRoleBadgeVariant(role: AdminRole): 'default' | 'secondary' | 'destructive' | 'outline' {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'default'; // Primary color
      case 'ADMIN':
        return 'secondary'; // Gray
      case 'READ_ONLY':
        return 'outline'; // Outline only
      default:
        return 'secondary';
    }
  }

  /**
   * Get role display label
   */
  function getRoleLabel(role: AdminRole): string {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Super Admin';
      case 'ADMIN':
        return 'Admin';
      case 'READ_ONLY':
        return 'Read Only';
      default:
        return role;
    }
  }

  /**
   * Get status badge variant
   */
  function getStatusVariant(isActive: boolean): 'default' | 'destructive' {
    return isActive ? 'default' : 'destructive';
  }

  /**
   * Get optimistic state indicator
   */
  function getOptimisticIndicator(admin: OptimisticAdmin) {
    if (!admin._optimistic) return null;

    if (admin._pending) {
      return (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3 animate-pulse" />
          Updating...
        </div>
      );
    }

    if (admin._error) {
      return (
        <div className="flex items-center gap-1 text-xs text-red-500">
          <AlertCircle className="h-3 w-3" />
          Error
        </div>
      );
    }

    return null;
  }

  /**
   * Render sort icon based on current sort state
   */
  const getSortIcon = (column: 'name' | 'email' | 'role' | 'isActive' | 'createdAt') => {
    if (sortColumn === null || sortColumn !== column) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    );
  };

  return (
    <>
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button variant="outline" size="sm" onClick={() => setError(null)} className="ml-2">
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Admin Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <button
                    className="flex items-center hover:text-foreground transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    Name
                    {getSortIcon('name')}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    className="flex items-center hover:text-foreground transition-colors"
                    onClick={() => handleSort('email')}
                  >
                    Email
                    {getSortIcon('email')}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    className="flex items-center hover:text-foreground transition-colors"
                    onClick={() => handleSort('role')}
                  >
                    Role
                    {getSortIcon('role')}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    className="flex items-center hover:text-foreground transition-colors"
                    onClick={() => handleSort('isActive')}
                  >
                    Status
                    {getSortIcon('isActive')}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    className="flex items-center hover:text-foreground transition-colors"
                    onClick={() => handleSort('createdAt')}
                  >
                    Created
                    {getSortIcon('createdAt')}
                  </button>
                </TableHead>
                <TableHead className="w-[70px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {optimisticAdmins.length > 0 ? (
                optimisticAdmins.map((admin) => (
                  <TableRow
                    key={admin.id}
                    className={`
                      ${admin._optimistic ? 'bg-muted/30' : ''}
                      ${!admin.isActive ? 'opacity-50' : ''}
                      ${admin._pending ? 'animate-pulse' : ''}
                      transition-all duration-200
                    `}
                  >
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span className={!admin.isActive ? 'line-through' : ''}>{admin.name}</span>
                        {getOptimisticIndicator(admin)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{admin.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(admin.role)} className="w-32 justify-center">
                        {admin.role === 'SUPER_ADMIN' && <Shield className="mr-1 h-3 w-3" />}
                        {getRoleLabel(admin.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(admin.isActive)} className="w-32 justify-center">
                        {admin.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(admin.createdAt).toLocaleDateString('en-GB')}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            disabled={admin._pending || !canManageAdmins}
                          >
                            <span className="sr-only">Open menu</span>
                            {admin._pending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreHorizontal className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => onEdit?.(admin)}
                            disabled={admin._pending || !admin.isActive}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {admin.isActive ? (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setAdminToDeactivate(admin)}
                              disabled={admin._pending}
                            >
                              <UserX className="mr-2 h-4 w-4" />
                              Deactivate
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => setAdminToReactivate(admin)}
                              disabled={admin._pending}
                            >
                              <UserCheck className="mr-2 h-4 w-4" />
                              Reactivate
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    {search ? (
                      <div>
                        <p className="text-lg font-semibold">No admin users found</p>
                        <p className="text-sm text-muted-foreground">
                          No admin users match your search for &ldquo;{search}&rdquo;
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-lg font-semibold">No admin users yet</p>
                        <p className="text-sm text-muted-foreground">
                          Add your first admin user to get started
                        </p>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Deactivate Confirmation Dialog */}
      <AlertDialog open={!!adminToDeactivate} onOpenChange={() => setAdminToDeactivate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Admin User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate{' '}
              <span className="font-semibold">{adminToDeactivate?.name}</span> (
              {adminToDeactivate?.email})? They will no longer be able to access the system. This
              action can be reversed later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => adminToDeactivate && handleDeactivateAdmin(adminToDeactivate)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deactivate User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reactivate Confirmation Dialog */}
      <AlertDialog open={!!adminToReactivate} onOpenChange={() => setAdminToReactivate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reactivate Admin User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reactivate{' '}
              <span className="font-semibold">{adminToReactivate?.name}</span> (
              {adminToReactivate?.email})? They will regain access to the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => adminToReactivate && handleReactivateAdmin(adminToReactivate)}
            >
              Reactivate User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
