"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Laag } from "@/types"
import { LaagCard } from "@/components/laags/laag-feed/laag-card"

export default function PublicFeed() {
  const [laags, setLaags] = useState<Laag[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchLaags = async () => {
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
          .eq("is_deleted", false)
          .eq("privacy", "public")
          .order("created_at", { ascending: false })

        if (error) throw error
        setLaags(data)
      } catch (error) {
        console.error("Error fetching laags:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchLaags()
  }, [supabase])

  if (loading) {
    return (
      <div className="container max-w-[680px] py-6 space-y-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
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
        ))}
      </div>
    )
  }

  if (laags.length === 0) {
    return (
      <div className="container max-w-[680px] py-6">
        <Card className="flex h-[200px] items-center justify-center border-dashed bg-muted/20">
          <div className="text-center">
            <p className="text-muted-foreground mb-2">No public laags yet</p>
            <p className="text-xs text-muted-foreground">Be the first to create one!</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-[680px] py-6 space-y-6">
      <h1 className="text-3xl font-bold">Public Laags</h1>
      {laags.map((laag) => (
        <LaagCard key={laag.id} laag={laag} members={[]} />
      ))}
    </div>
  )
} 