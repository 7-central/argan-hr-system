export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // This layout is now just a pass-through
  // Protected routes use (protected)/layout.tsx
  // Auth routes use (auth)/layout.tsx or no layout
  return <>{children}</>
}