/**
 * Contract-related business utility functions
 * Pure business logic without presentation concerns
 */

/**
 * Contract renewal urgency levels
 */
export type ContractRenewalUrgency = 'URGENT' | 'WARNING' | 'SAFE' | 'NONE';

/**
 * Calculate contract renewal urgency based on business rules
 *
 * Business Rules:
 * - URGENT: Within 30 days of renewal
 * - WARNING: Within 90 days of renewal
 * - SAFE: More than 90 days until renewal
 * - NONE: No renewal date set
 *
 * @param renewalDate - Contract renewal date (Date object or ISO string)
 * @returns Urgency level
 */
export function getContractRenewalUrgency(
  renewalDate: Date | string | null
): ContractRenewalUrgency {
  if (!renewalDate) {
    return 'NONE';
  }

  const today = new Date();
  // Handle both Date objects and ISO strings (from Prisma serialization)
  const renewal = renewalDate instanceof Date ? renewalDate : new Date(renewalDate);
  const daysUntilRenewal = Math.ceil(
    (renewal.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Business rule: Within 30 days is urgent
  if (daysUntilRenewal <= 30) {
    return 'URGENT';
  }

  // Business rule: Within 90 days is warning
  if (daysUntilRenewal <= 90) {
    return 'WARNING';
  }

  // Business rule: More than 90 days is safe
  return 'SAFE';
}
