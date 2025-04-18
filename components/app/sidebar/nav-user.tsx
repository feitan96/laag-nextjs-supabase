// components/nav-user.tsx
"use client"

import {
  BadgeCheck,
  LogOut,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useAuth } from "@/app/context/auth-context"
import { useAvatar } from "@/hooks/useAvatar"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { useCallback, useMemo, memo } from "react"
import { Skeleton } from "@/components/ui/skeleton"

const supabase = createClient()

const NavUser = memo(function NavUser() {
  const { isMobile } = useSidebar()
  const { user, profile, isLoading } = useAuth()
  const avatarUrl = useAvatar(profile?.avatar_url || null) 
  const router = useRouter()

  const handleAccountClick = useCallback(() => {
    router.push("/account")
  }, [router])

  const handleLogout = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        throw error
      }
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }, [router])

  const userDisplayName = useMemo(() => {
    return profile?.full_name || user?.email?.split('@')[0] || "User"
  }, [profile?.full_name, user?.email])

  const userInitial = useMemo(() => {
    return (profile?.full_name?.charAt(0) || user?.email?.charAt(0) || "U").toUpperCase()
  }, [profile?.full_name, user?.email])

  if (isLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg">
            <Skeleton className="h-8 w-8 rounded-lg" />
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage
                  src={avatarUrl || undefined}
                  alt={userDisplayName || "User"}
                />
                <AvatarFallback className="rounded-lg">
                  {userInitial}
                </AvatarFallback>
              </Avatar>
              {/* <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{userDisplayName}</span>
                <span className="truncate text-xs">{user?.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" /> */}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                {/* <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage
                    src={avatarUrl || undefined}
                    alt={userDisplayName || "User"}
                  />
                  <AvatarFallback className="rounded-lg">
                    {userInitial}
                  </AvatarFallback>
                </Avatar> */}
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{userDisplayName}</span>
                  <span className="truncate text-xs">{user?.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={handleAccountClick}>
                <BadgeCheck />
                Account
              </DropdownMenuItem>
              {/* <DropdownMenuItem>
                <Bell />
                Notifications
              </DropdownMenuItem> */}
            </DropdownMenuGroup>
            {/* <DropdownMenuSeparator /> */}
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}, (prevProps, nextProps) => {
  return true
})

export { NavUser }