"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { createClient } from "@/utils/supabase/client"
import { useGroupPicture } from "@/hooks/useGroupPicture"
import { format } from "date-fns"
import Image from "next/image"
import { Users } from "lucide-react"
import { useRouter } from "next/navigation"

interface UpcomingLaag {
  id: string
  what: string
  type: string
  when_start: string
  when_end: string
  group: {
    id: string
    group_name: string
    group_picture: string | null
  }
}

function UpcomingLaagRow({ laag }: { laag: UpcomingLaag }) {
  const router = useRouter()
  const groupPictureUrl = useGroupPicture(laag.group.group_picture)

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50"
      onClick={() => router.push(`/user/groups/${laag.group.id}/laags/${laag.id}?from=group`)}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
        {laag.group.group_picture ? (
          <Image
            src={groupPictureUrl || "/placeholder.svg"}
            alt={laag.group.group_name}
            width={40}
            height={40}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <Users className="h-5 w-5 text-primary" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{laag.group.group_name}</p>
        <p className="text-xs text-muted-foreground">{laag.type}</p>
        <p className="text-xs text-muted-foreground truncate">
          {laag.what.length > 10 ? `${laag.what.substring(0, 10)}...` : laag.what}
        </p>
        <div className="text-xs text-muted-foreground">
          {format(new Date(laag.when_start), "MMM d, yyyy")} - {format(new Date(laag.when_end), "MMM d, yyyy")}
        </div>
      </div>
    </div>
  )
}

export function UpcomingLaagsCard() {
  const [upcomingLaags, setUpcomingLaags] = useState<UpcomingLaag[]>([])
  const [loading, setLoading] = useState(true)
  const [displayCount, setDisplayCount] = useState(5)
  const supabase = createClient()

  useEffect(() => {
    async function fetchUpcomingLaags() {
      try {
        const { data, error } = await supabase
          .from("laags")
          .select(`
            id,
            what,
            type,
            when_start,
            when_end,
            group:groups(
              id,
              group_name,
              group_picture
            )
          `)
          .eq("status", "Planning")
          .eq("is_deleted", false)
          .order("when_start", { ascending: true })

        if (error) throw error
        setUpcomingLaags(data)
      } catch (error) {
        console.error("Error fetching upcoming laags:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUpcomingLaags()
  }, [supabase])

  const visibleLaags = upcomingLaags.slice(0, displayCount)
  const hasMoreLaags = upcomingLaags.length > displayCount

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Upcoming Laags</CardTitle>
        <CardDescription>Your planned laags across all groups</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4 custom-scrollbar">
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-20 bg-muted rounded-lg" />
                </div>
              ))}
            </div>
          ) : upcomingLaags.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground">No upcoming laags found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleLaags.map((laag) => (
                <UpcomingLaagRow key={laag.id} laag={laag} />
              ))}
              {hasMoreLaags && (
                <Button
                  variant="ghost"
                  className="w-full text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => setDisplayCount(prev => prev + 5)}
                >
                  Show more laags
                </Button>
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}