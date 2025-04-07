// components/app/nav-global/nav-global.tsx
"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { Map, UsersRound, PieChart } from "lucide-react"
import Image from "next/image"

import { NavUser } from "../sidebar/nav-user"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/app/context/auth-context"

const projects = [
  {
    name: "Feed",
    url: "/user/feed",
    icon: Map,
  },
  {
    name: "Groups",
    url: "/user/groups",
    icon: UsersRound,
  },
  {
    name: "Dashboard",
    url: "/dashboard",
    icon: PieChart,
  },
]

export function NavGlobal() {
  const router = useRouter()
  const { user, profile } = useAuth()

  const userDisplayName = useMemo(() => {
    return profile?.username || user?.email
  }, [profile?.username, user?.email])

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="mx-auto flex h-16 w-full max-w-[100vw] items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left section - Logo and Navigation */}
        <div className="flex items-center gap-6">
          {/* Logo */}
          <div className="flex items-center">
            <Image
              src="/laag-dark-mode.png"
              alt="Laag Logo"
              width={32}
              height={32}
              className="dark:hidden"
            />
            <Image
              src="/laag-light-mode.png"
              alt="Laag Logo"
              width={32}
              height={32}
              className="hidden dark:block"
            />
          </div>

          {/* Navigation Links - Hidden on mobile */}
          <div className="hidden md:flex md:items-center md:gap-1">
            {projects.map((item) => (
              <Button
                key={item.name}
                variant="ghost"
                className="gap-2"
                onClick={() => router.push(item.url)}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Right section - User Menu */}
        <div className="flex items-center gap-2">
          <NavUser />
        </div>
      </div>
    </nav>
  )
}