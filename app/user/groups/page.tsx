import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import React from 'react'
import { GroupList } from './group-list'

const page = () => {
  return (
    <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
        <SidebarTrigger className="-ml-1" />
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-4">Groups</h1>
          <GroupList /> {/* Render the GroupList component */}
        </div>
        </SidebarInset>
    </SidebarProvider>
  )
}

export default page