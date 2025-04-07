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
        <main className="flex flex-1 items-center justify-center overflow-x-hidden">
          <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
})

export default AuthenticatedLayout