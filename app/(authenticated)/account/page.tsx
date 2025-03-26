import { AppSidebar } from "@/components/app-sidebar"
import AccountForm from "./account-form"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export default async function Account() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
        <SidebarTrigger className="-ml-1" />
          <AccountForm />
        </SidebarInset>
    </SidebarProvider>
  )
}

