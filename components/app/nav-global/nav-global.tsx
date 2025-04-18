// components/app/nav-global/nav-global.tsx
"use client"

import { useMemo, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Map, UsersRound, PieChart } from "lucide-react"
import Image from "next/image"
import { useTheme } from "next-themes" // Add this import
import { NotificationsDropdown } from "./notifications-dropdown"
import { SearchLaags } from "./search-laags"
import { Skeleton } from "@/components/ui/skeleton"

import { NavUser } from "../sidebar/nav-user"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/app/context/auth-context"

const projects = [
  // {
  //   name: "Feed",
  //   url: "/user/feed",
  //   icon: Map,
  // },
  // {
  //   name: "Groups",
  //   url: "/user/groups",
  //   icon: UsersRound,
  // },
  // {
  //   name: "Dashboard",
  //   url: "/dashboard",
  //   icon: PieChart,
  // },
]

export function NavGlobal() {
  const { theme, systemTheme } = useTheme()
  const router = useRouter()
  const { user, profile } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't calculate theme until component is mounted
  const currentTheme = mounted ? (theme === 'system' ? systemTheme : theme) : undefined

  const userDisplayName = useMemo(() => {
    return profile?.username || user?.email
  }, [profile?.username, user?.email])

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container mx-auto flex h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Left section - Logo and Navigation */}
        <div className="flex items-center gap-6">
          {/* Logo */}
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => router.push('/user/feed')}
          >
            <div className="relative h-8 w-8">
              {mounted && (
                <>
                  <Image
                    src="/laag-dark-v1.png"
                    alt="Laag Logo"
                    fill
                    className={`object-contain absolute ${
                      currentTheme === 'dark' ? 'opacity-100' : 'opacity-0'
                    }`}
                    priority
                  />
                  <Image
                    src="/laag-light-mode.png"
                    alt="Laag Logo"
                    fill
                    className={`object-contain absolute ${
                      currentTheme === 'light' ? 'opacity-100' : 'opacity-0'
                    }`}
                    priority
                  />
                </>
              )}
            </div>
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

        {/* Center section - Search */}
        <div className="flex-1 px-6 flex justify-center">
          <div className="w-full max-w-md">
            <SearchLaags />
          </div>
        </div>

        {/* Right section - User Menu */}
        <div className="flex items-center gap-4">
          {!mounted ? (
            <>
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </>
          ) : (
            <>
              {user && <NotificationsDropdown userId={user.id} />}
              <NavUser />
            </>
          )}
        </div>
      </div>
    </nav>
  )
}