"use client"

import { createClient } from "@/utils/supabase/client"
import { useEffect, useState } from "react"

export function useRole() {
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function getRole() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setRole(null)
          return
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single()

        if (error) throw error
        setRole(data.role)
      } catch (error) {
        console.error("Error fetching role:", error)
        setRole(null)
      } finally {
        setLoading(false)
      }
    }

    getRole()
  }, [])

  return { role, loading }
}