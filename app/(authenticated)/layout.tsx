// app/(authenticated)/layout.tsx
import { NavGlobal } from "@/components/app/nav-global/nav-global"
import { SidebarProvider } from "@/components/ui/sidebar"
import { memo } from "react"

const AuthenticatedLayout = memo(function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full flex-col">
        <NavGlobal />
        <main className="flex-1 overflow-x-hidden">{children}</main>
      </div>
    </SidebarProvider>
  )
})

export default AuthenticatedLayout