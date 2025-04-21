"use client"

import { NavGlobal } from "@/components/app/nav-global/nav-global"
import { AdminLayout } from "@/components/app/layouts/admin-layout"
import { SidebarProvider } from "@/components/ui/sidebar"
import { useRole } from "@/hooks/useRole"
import { redirect, usePathname } from "next/navigation"
import { AdminLoadingLayout, UserLoadingLayout } from "./loading-layouts"

export function RoleBasedLayout({ children }: { children: React.ReactNode }) {
  const { role, loading } = useRole()
  const pathname = usePathname()

  if (loading) {
    // Show appropriate loading layout based on the current path
    return pathname.startsWith('/admin') 
      ? <AdminLoadingLayout /> 
      : <UserLoadingLayout />
  }

  if (!role) {
    redirect("/auth/login")
  }

  if (role === "admin") {
    return (
      <SidebarProvider>
        <AdminLayout>{children}</AdminLayout>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full flex-col">
        <NavGlobal />
        <main className="flex flex-1 justify-center">
          <div className="w-full max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}