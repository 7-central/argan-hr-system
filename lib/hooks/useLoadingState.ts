'use client'

import { useState, useCallback } from 'react'

/**
 * Custom hook for managing loading states with async operations
 * Provides standardized loading state management across components
 *
 * @returns Object with loading state and execution utilities
 *
 * @example
 * ```typescript
 * const { isLoading, execute, error } = useLoadingState()
 *
 * const handleSubmit = () => {
 *   execute(async () => {
 *     await createClient(formData)
 *   })
 * }
 * ```
 */
export function useLoadingState() {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Execute an async operation with automatic loading state management
   * @param operation - Async function to execute
   * @returns Promise that resolves with the operation result
   */
  const execute = useCallback(async <T>(operation: () => Promise<T>): Promise<T | undefined> => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await operation()
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMessage)
      console.error('Loading state operation failed:', err)
      return undefined
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Reset error state manually
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  /**
   * Reset all state to initial values
   */
  const reset = useCallback(() => {
    setIsLoading(false)
    setError(null)
  }, [])

  return {
    isLoading,
    error,
    execute,
    clearError,
    reset,
  }
}

/**
 * Hook for managing multiple loading states
 * Useful for components that have multiple async operations
 *
 * @param keys - Array of string keys for different loading states
 * @returns Object with loading states and utilities for each key
 *
 * @example
 * ```typescript
 * const { isLoading, setLoading } = useMultipleLoadingStates(['save', 'delete'])
 *
 * // Check specific loading state
 * if (isLoading.save) { ... }
 *
 * // Set specific loading state
 * setLoading('save', true)
 * ```
 */
export function useMultipleLoadingStates(keys: string[]) {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    keys.reduce((acc, key) => ({ ...acc, [key]: false }), {})
  )

  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: loading }))
  }, [])

  const execute = useCallback(async <T>(
    key: string,
    operation: () => Promise<T>
  ): Promise<T | undefined> => {
    setLoading(key, true)
    try {
      const result = await operation()
      return result
    } catch (err) {
      console.error(`Loading state operation failed for ${key}:`, err)
      return undefined
    } finally {
      setLoading(key, false)
    }
  }, [setLoading])

  const resetAll = useCallback(() => {
    setLoadingStates(keys.reduce((acc, key) => ({ ...acc, [key]: false }), {}))
  }, [keys])

  return {
    isLoading: loadingStates,
    setLoading,
    execute,
    resetAll,
  }
}