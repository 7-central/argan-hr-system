/**
 * Client Actions
 * Re-exports Server Actions for use in lib layer (hooks, components)
 * This maintains proper architectural layering while allowing Client Components
 * to call Server Actions
 *
 * Note: This file is an architectural bridge that allows lib layer (hooks/components)
 * to call Server Actions while maintaining proper separation of concerns.
 * The app layer defines the actions, and this file re-exports them for use in Client Components.
 */

// eslint-disable-next-line no-restricted-imports -- Architectural bridge: lib layer re-exports app layer Server Actions
export {
  createClient,
  updateClient,
  deleteClient,
  getOnboarding,
  updateOnboardingField,
} from '@/app/admin/(protected)/clients/actions';
