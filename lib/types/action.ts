/**
 * Standard result type for Server Actions
 * Provides consistent return structure with success/error states
 *
 * Server Actions should return result objects instead of throwing errors
 * to ensure proper error serialization across client/server boundaries
 */
export type ServerActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };
