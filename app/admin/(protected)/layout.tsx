import { redirect } from 'next/navigation'
import { validateAdminSession } from '@/lib/auth/session'
import { ProtectedLayoutClient } from '@/components/layouts/protected-layout-client'

// Force dynamic rendering for all protected routes
export const dynamic = 'force-dynamic'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Validate session - redirect to login if not authenticated
  const session = await validateAdminSession()

  if (!session) {
    redirect('/admin/login')
  }

  return (
    <ProtectedLayoutClient
      user={{
        name: session.name,
        email: session.email,
        role: session.role,
      }}
    >
      {children}
    </ProtectedLayoutClient>
  )
}