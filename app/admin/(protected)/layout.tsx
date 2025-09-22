import { redirect } from 'next/navigation'
import { validateAdminSession } from '@/lib/auth/session'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { Separator } from '@/components/ui/separator'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from '@/components/ui/breadcrumb'

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
    <SidebarProvider>
      <AppSidebar user={{
        name: session.name,
        email: session.email,
        role: session.role,
      }} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b">
          <div className="flex items-center gap-2 px-3">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/admin">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <main className="flex-1">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}