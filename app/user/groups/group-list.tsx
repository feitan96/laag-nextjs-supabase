// app/user/groups/group-list.tsx
"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"

export function GroupList() {
  const [groups, setGroups] = useState<{ group_name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const { data, error } = await supabase
          .from("groups")
          .select("group_name")

        if (error) {
          throw error
        }

        setGroups(data || [])
      } catch (error) {
        console.error("Error fetching groups:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchGroups()
  }, [supabase])

  if (loading) {
    return <div>Loading groups...</div>
  }

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold">Groups</h2>
      <ul className="space-y-1">
        {groups.map((group, index) => (
          <li key={index} className="p-2 border rounded">
            {group.group_name}
          </li>
        ))}
      </ul>
    </div>
  )
}