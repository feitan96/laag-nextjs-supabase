"use client"

import { createClient } from "@/utils/supabase/client"
import { getUserRole } from "@/services/roles"
import { useEffect, useState } from "react"

export function useRole() {
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function getRole() {
      try {
        const role = await getUserRole(supabase)
        setRole(role)
      } finally {
        setLoading(false)
      }
    }

    getRole()
  }, [])

  return { role, loading }
}