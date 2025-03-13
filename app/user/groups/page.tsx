import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import React from 'react'

const page = () => {
  return (
    <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
        <SidebarTrigger className="-ml-1" />
          <div>page</div>
        </SidebarInset>
    </SidebarProvider>
  )
}

export default page