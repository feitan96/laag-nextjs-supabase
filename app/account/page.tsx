import AccountForm from "./account-form"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"

export default async function Account() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="flex flex-col items-center w-full">
      <AccountForm user={user} />
    </div>
  )
}

