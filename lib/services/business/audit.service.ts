import { AuditInterval, ClientAudit, PrismaClient } from '@prisma/client';

import { getDatabaseInstance } from '@/lib/database';
import { ValidationError } from '@/lib/errors';

interface UpdateAuditDto {
  auditedBy?: string;
  interval?: AuditInterval;
  nextAuditDate?: Date;
}

/**
 * AuditService - Business logic for audit management
 */
export class AuditService {
  constructor(private readonly db: PrismaClient) {}

  /**
   * Update an audit by ID
   */
  async updateAudit(auditId: number, data: UpdateAuditDto): Promise<ClientAudit> {
    // Validate audit ID
    if (!auditId || auditId < 1) {
      throw new ValidationError('Invalid audit ID');
    }

    // Check if audit exists
    const existingAudit = await this.db.clientAudit.findUnique({
      where: { id: auditId },
    });

    if (!existingAudit) {
      throw new ValidationError(`Audit with ID ${auditId} not found`);
    }

    // Update the audit
    const updatedAudit = await this.db.clientAudit.update({
      where: { id: auditId },
      data: {
        ...(data.auditedBy !== undefined && { auditedBy: data.auditedBy }),
        ...(data.interval !== undefined && { interval: data.interval }),
        ...(data.nextAuditDate !== undefined && { nextAuditDate: data.nextAuditDate }),
      },
    });

    return updatedAudit;
  }

  /**
   * Delete an audit by ID
   */
  async deleteAudit(auditId: number): Promise<void> {
    // Validate audit ID
    if (!auditId || auditId < 1) {
      throw new ValidationError('Invalid audit ID');
    }

    // Check if audit exists
    const existingAudit = await this.db.clientAudit.findUnique({
      where: { id: auditId },
    });

    if (!existingAudit) {
      throw new ValidationError(`Audit with ID ${auditId} not found`);
    }

    // Delete the audit
    await this.db.clientAudit.delete({
      where: { id: auditId },
    });
  }
}

// Singleton instance
const db = getDatabaseInstance();
export const auditService = new AuditService(db);
