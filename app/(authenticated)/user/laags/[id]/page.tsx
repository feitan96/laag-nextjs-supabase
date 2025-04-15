"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { useParams } from "next/navigation"
import { Laag } from "@/types"
import { LaagCard } from "@/components/laags/laag-feed/laag-card"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function LaagDetails() {
  const [laag, setLaag] = useState<Laag | null>(null)
  const [loading, setLoading] = useState(true)
  const params = useParams()
  const supabase = createClient()

  useEffect(() => {
    const fetchLaag = async () => {
      try {
        const { data, error } = await supabase
          .from("laags")
          .select(`
            *,
            organizer:profiles!organizer(id, full_name, avatar_url),
            laagImages(*),
            laagAttendees(*),
            comments(
              id,
              comment,
              created_at,
              updated_at,
              user_id,
              laag_id,
              is_deleted,
              user:profiles(id, full_name, avatar_url)
            )
          `)
          .eq("id", params.id)
          .eq("privacy", "public")
          .single()

        if (error) throw error
        setLaag(data)
      } catch (error) {
        console.error("Error fetching laag:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchLaag()
  }, [params.id, supabase])

  if (loading) {
    return (
      <div className="container max-w-[680px] py-6">
        <Card className="overflow-hidden">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[180px]" />
                <Skeleton className="h-3 w-[120px]" />
              </div>
            </div>
          </div>
          <div className="p-4 pt-0">
            <Skeleton className="h-6 w-[70%] mb-3" />
            <Skeleton className="h-4 w-[40%] mb-3" />
            <Skeleton className="h-20 w-full mb-4" />
            <div className="grid grid-cols-2 gap-3 mb-4">
              <Skeleton className="h-16 rounded-lg" />
              <Skeleton className="h-16 rounded-lg" />
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <Skeleton className="aspect-square rounded-md" />
              <Skeleton className="aspect-square rounded-md" />
            </div>
          </div>
          <div className="p-4 pt-0">
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-32 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (!laag) {
    return (
      <div className="container max-w-[680px] py-6">
        <Card className="flex h-[200px] items-center justify-center border-dashed bg-muted/20">
          <div className="text-center">
            <p className="text-muted-foreground mb-2">Laag not found</p>
            <p className="text-xs text-muted-foreground">This laag might have been deleted or is not public.</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-[680px] py-6">
      <LaagCard laag={laag} members={[]} />
    </div>
  )
} 