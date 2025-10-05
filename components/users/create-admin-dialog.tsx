'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { AdminRoleEnum } from '@/lib/types/admin';
import { createAdminSchema, type CreateAdminFormValues } from '@/lib/validations/admin';

import { Button } from '@/components/ui/button';
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

import { createUser } from '@/app/admin/(protected)/users/actions';

/**
 * Props for CreateAdminDialog
 */
export interface CreateAdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Create Admin Dialog Component
 * Modal form for creating new admin users
 *
 * Features:
 * - React Hook Form with Zod validation
 * - Password confirmation matching
 * - Role selection (SUPER_ADMIN, ADMIN, VIEWER)
 * - Form validation and error messages
 * - Toast notifications for success/error
 * - Auto-refresh page on success
 */
export function CreateAdminDialog({ open, onOpenChange }: CreateAdminDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CreateAdminFormValues>({
    resolver: zodResolver(createAdminSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: AdminRoleEnum.ADMIN,
    },
  });

  async function onSubmit(data: CreateAdminFormValues) {
    setIsLoading(true);

    // Call server action - returns result object instead of throwing
    const result = await createUser({
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role,
    });

    setIsLoading(false);

    // Check result and show appropriate feedback
    if (result.success) {
      toast.success('Admin user created successfully', {
        description: `${data.name} has been added to the system.`,
      });

      // Reset form
      form.reset();

      // Small delay to allow toast to render before closing dialog
      setTimeout(() => {
        onOpenChange(false);
      }, 100);

      // Refresh the page to show new admin
      router.refresh();
    } else {
      // Show user-friendly error message from server
      toast.error('Failed to create admin user', {
        description: result.error,
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Admin User</DialogTitle>
          <DialogDescription>
            Add a new administrator to the system. They will be able to log in immediately after creation.
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
                    defaultValue={field.value}
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

            {/* Password Field */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Enter password"
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
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Confirm password"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                {isLoading ? 'Creating...' : 'Create Admin'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
