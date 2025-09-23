'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState, useTransition } from 'react'
import { Input } from "@/components/ui/input"
import { Search, Loader2 } from "lucide-react"

interface ClientSearchProps {
  placeholder?: string
  className?: string
}

export function ClientSearch({
  placeholder = "Search clients by name, email, or contact...",
  className
}: ClientSearchProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [isPending, startTransition] = useTransition()

  // Debounced search function with transition
  const updateSearch = useCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString())

    if (value) {
      params.set('search', value)
    } else {
      params.delete('search')
    }

    // Reset to first page when searching
    params.set('page', '1')

    // Use startTransition to show loading state
    startTransition(() => {
      router.push(`/admin/clients?${params.toString()}`)
    })
  }, [router, searchParams])

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      updateSearch(searchTerm)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm, updateSearch])

  return (
    <div className={`relative ${className || ''}`}>
      {isPending ? (
        <Loader2 className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground animate-spin" />
      ) : (
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      )}
      <Input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={placeholder}
        className="pl-8 md:w-[300px] lg:w-[400px]"
        disabled={isPending}
      />
    </div>
  )
}