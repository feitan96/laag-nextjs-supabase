"use client"

import {
  LayoutDashboard,
  Users,
  Map,
  Group,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { NavAdmin } from "../sidebar/nav-admin"

const sidebarNavItems = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Groups",
    href: "/admin/groups",
    icon: Group,
  },
  {
    title: "Laags",
    href: "/admin/laags",
    icon: Map,
  },
]

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 flex w-64 flex-col border-r bg-background">
        {/* Logo */}
        <div className="flex h-14 items-center border-b px-6">
          <Link href="/admin" className="flex items-center gap-2 font-semibold">
            <img src="/laag-dark-v1.png" alt="Logo" className="h-6 w-6" />
            <span>Laag Admin</span>
          </Link>
        </div>

        {/* Nav Links */}
        <div className="flex-1 px-4 py-4">
          <nav className="space-y-2">
            {sidebarNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
                  pathname === item.href
                    ? "bg-secondary text-secondary-foreground"
                    : "hover:bg-secondary/50"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            ))}
          </nav>
        </div>

        {/* User Section */}
        <div className="border-t p-4">
          <NavAdmin />
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 flex-1">
        <div className="container p-8">
          <div className="space-y-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}