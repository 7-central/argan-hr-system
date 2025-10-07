'use server';

import { revalidatePath } from 'next/cache';

import { AuditInterval } from '@prisma/client';

import { withAuth } from '@/lib/server-actions/with-auth';
import { auditService } from '@/lib/services/business/audit.service';

interface UpdateAuditDto {
  auditedBy?: string;
  interval?: AuditInterval;
  nextAuditDate?: Date;
}

/**
 * Update an audit
 */
export const updateAudit = withAuth(
  async (
    _session,
    auditId: number,
    data: UpdateAuditDto
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await auditService.updateAudit(auditId, data);

      // Revalidate the client page to show updated audit
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
        error: 'An unexpected error occurred while updating the audit',
      };
    }
  }
);

/**
 * Delete an audit
 */
export const deleteAudit = withAuth(
  async (_session, auditId: number): Promise<{ success: boolean; error?: string }> => {
    try {
      await auditService.deleteAudit(auditId);

      // Revalidate the client page to show updated audits
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
        error: 'An unexpected error occurred while deleting the audit',
      };
    }
  }
);
