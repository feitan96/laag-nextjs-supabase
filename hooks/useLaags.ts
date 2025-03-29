// hooks/useLaags.ts
import { useState, useEffect } from "react"
import { fetchLaags } from "@/services/laags"
import { Laag } from "@/types"

export const useLaags = (groupId: string) => {
  const [laags, setLaags] = useState<Laag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const loadLaags = async () => {
      try {
        const data = await fetchLaags(groupId)
        setLaags(data)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    loadLaags()
  }, [groupId])

  return { laags, loading, error, refetch: () => setLoading(true) }
}