import { AdminLoginForm } from '@/components/admin-login-form'

// Force dynamic rendering for sidebar context
export const dynamic = 'force-dynamic'

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <AdminLoginForm />
    </div>
  )
}