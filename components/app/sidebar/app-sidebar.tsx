// components/app-sidebar.tsx
"use client"

import * as React from "react"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
  UsersRound,
} from "lucide-react"

import { NavMain } from "@/components/app/sidebar/nav-main"
import { NavProjects } from "@/components/app/sidebar/nav-projects"
import { NavUser } from "@/components/app/sidebar/nav-user"
import { TeamSwitcher } from "@/components/app/sidebar/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { memo, useMemo } from "react"

// This is sample data.
const data = {
  teams: [
    {
      name: "Laag",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Laags",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Playground",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "History",
          url: "#",
        },
        {
          title: "Starred",
          url: "#",
        },
        {
          title: "Settings",
          url: "#",
        },
      ],
    }
  ],
  projects: [
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
  ],
}

const AppSidebar = memo(function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const memoizedData = useMemo(() => data, [])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={memoizedData.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={memoizedData.navMain} />
        <NavProjects projects={memoizedData.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
})

export { AppSidebar }