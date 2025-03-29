import AccountForm from "../../../components/account/account-form"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { SidebarTrigger } from "@/components/ui/sidebar"

export default async function Account() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <>
      <SidebarTrigger className="-ml-1" />
      <AccountForm />
    </>
  )
}

