// hooks/useLaags.ts
import { useState, useEffect, useCallback } from "react"
import { fetchLaags, fetchMembers } from "@/services/laags"
import { Laag, Member } from "@/types"

export const useLaags = (groupId: string) => {
  const [laags, setLaags] = useState<Laag[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [laagsData, membersData] = await Promise.all([
        fetchLaags(groupId),
        fetchMembers(groupId)
      ])
      setLaags(laagsData)
      setMembers(membersData)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [groupId])

  useEffect(() => {
    loadData()
  }, [loadData])

  return { 
    laags, 
    members, 
    loading, 
    error, 
    refetch: loadData 
  }
}