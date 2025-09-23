'use client'

import * as React from 'react'
import { SidebarProvider as BaseSidebarProvider, useSidebar as baseUseSidebar } from '@/components/ui/sidebar'

// Re-export the provider unchanged
export function SidebarProvider(props: React.ComponentProps<typeof BaseSidebarProvider>) {
  return <BaseSidebarProvider {...props} />
}

// Wrapped hook with surgical tracing
export function useSidebar() {
  try {
    return baseUseSidebar()
  } catch (error) {
    // Stack trace for debugging SSR usage
    const traceError = new Error('useSidebar() called outside SidebarProvider (SSR context?)')
    console.error('[SIDEBAR TRACE] Error location:', traceError.stack)
    console.error('[SIDEBAR TRACE] Original error:', error)
    throw error
  }
}