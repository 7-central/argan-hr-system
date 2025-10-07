/**
 * Contract-related constants
 * Defines default values and options for contracts
 */

/**
 * Available services for "Agreed Services (In Scope)"
 * Services included in the standard service tier
 */
export const AVAILABLE_SERVICES_IN_SCOPE = [
  'HR Admin Support',
  'Employment Law Support',
  'Employee Support',
  'Auto Policy Review and Updates',
  'Service Analytics',
] as const;

/**
 * Available services for "Extra Rates (Out of Scope)"
 * Additional services available at extra cost
 */
export const AVAILABLE_SERVICES_OUT_OF_SCOPE = [
  'Case Management',
  'On Site Support',
  'External Audit Reviews',
] as const;

/**
 * Default inclusive services (In Scope) for new contracts
 */
export const DEFAULT_SERVICES_IN_SCOPE = AVAILABLE_SERVICES_IN_SCOPE;

/**
 * Default out of scope services for new contracts (empty by default)
 */
export const DEFAULT_SERVICES_OUT_OF_SCOPE: string[] = [];

/**
 * Types for service options
 */
export type ServiceInScope = typeof AVAILABLE_SERVICES_IN_SCOPE[number];
export type ServiceOutOfScope = typeof AVAILABLE_SERVICES_OUT_OF_SCOPE[number];
