'use client';

import { useState, useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { AdminRoleEnum } from '@/lib/types/admin';
import { editAdminSchema, type EditAdminFormValues } from '@/lib/validations/admin';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { updateUser } from '@/app/admin/(protected)/users/actions';

import type { SerializableAdmin } from '@/lib/types/admin';

/**
 * Props for EditAdminDialog
 */
export interface EditAdminDialogProps {
  admin: SerializableAdmin | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Edit Admin Dialog Component
 * Modal form for editing existing admin users
 *
 * Features:
 * - React Hook Form with Zod validation
 * - Optional password change with checkbox
 * - Password confirmation matching
 * - Role selection (SUPER_ADMIN, ADMIN, VIEWER)
 * - Active/Inactive status toggle
 * - Form validation and error messages
 * - Toast notifications for success/error
 * - Auto-refresh page on success
 */
export function EditAdminDialog({ admin, open, onOpenChange }: EditAdminDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<EditAdminFormValues>({
    resolver: zodResolver(editAdminSchema),
    defaultValues: {
      name: '',
      email: '',
      role: AdminRoleEnum.ADMIN,
      isActive: true,
      changePassword: false,
      password: '',
      confirmPassword: '',
    },
  });

  const watchChangePassword = form.watch('changePassword');

  // Load admin data when dialog opens or admin changes
  useEffect(() => {
    if (admin && open) {
      form.reset({
        name: admin.name,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive,
        changePassword: false,
        password: '',
        confirmPassword: '',
      });
    }
  }, [admin, open, form]);

  async function onSubmit(data: EditAdminFormValues) {
    if (!admin) return;

    setIsLoading(true);

    // Call server action - returns result object instead of throwing
    const result = await updateUser(admin.id, {
      name: data.name,
      email: data.email,
      role: data.role,
      isActive: data.isActive,
      ...(data.changePassword && data.password ? { password: data.password } : {}),
    });

    setIsLoading(false);

    // Check result and show appropriate feedback
    if (result.success) {
      toast.success('Admin user updated successfully', {
        description: `${data.name}'s profile has been updated.`,
      });

      // Small delay to allow toast to render before closing dialog
      setTimeout(() => {
        onOpenChange(false);
      }, 100);

      // Refresh the page to show updated admin
      router.refresh();
    } else {
      // Show user-friendly error message from server
      toast.error('Failed to update admin user', {
        description: result.error,
      });
    }
  }

  if (!admin) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Admin User</DialogTitle>
          <DialogDescription>
            Update administrator details. Changes will take effect immediately.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Name Field */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="John Smith"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email Field */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="john@example.com"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Role Field */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    disabled={isLoading}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={AdminRoleEnum.SUPER_ADMIN}>
                        Super Admin (Full Access)
                      </SelectItem>
                      <SelectItem value={AdminRoleEnum.ADMIN}>
                        Admin (Manage Clients)
                      </SelectItem>
                      <SelectItem value={AdminRoleEnum.READ_ONLY}>
                        Read Only (View Only)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Both SUPER_ADMIN and ADMIN can manage admin users
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Active Status Field */}
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Active Status
                    </FormLabel>
                    <FormDescription>
                      Inactive users cannot log in to the system
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {/* Change Password Checkbox */}
            <FormField
              control={form.control}
              name="changePassword"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Change Password
                    </FormLabel>
                    <FormDescription>
                      Check this to set a new password for this user
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {/* Conditional Password Fields */}
            {watchChangePassword && (
              <>
                {/* Password Field */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Enter new password"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Must be 8+ characters with uppercase, lowercase, and number
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Confirm Password Field */}
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Confirm new password"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
