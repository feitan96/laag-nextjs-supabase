"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { createClient } from "@/utils/supabase/client"
import { useGroupPicture } from "@/hooks/useGroupPicture"
import { format } from "date-fns"
import Image from "next/image"
import { Users, Calendar, Clock } from "lucide-react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

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
      className="group relative flex flex-col gap-1.5 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => router.push(`/user/groups/${laag.group.id}/laags/${laag.id}?from=group`)}
    >
      <div className="flex items-center gap-2">
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
        <div className="flex-1 min-w-0 flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold truncate text-sm">{laag.group.group_name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {laag.what.length > 10 ? `${laag.what.substring(0, 10)}...` : laag.what}
            </p>
          </div>
          <Badge variant="outline" className="shrink-0 text-xs">
            {laag.type}
          </Badge>
        </div>
      </div>
      <Separator className="my-1.5" />
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>{format(new Date(laag.when_start), "MMM d, yyyy")}</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>{format(new Date(laag.when_end), "MMM d, yyyy")}</span>
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
    const fetchUpcomingLaags = async () => {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError) throw userError

        // Fetch laags where the user is an attendee and not removed
        const { data, error } = await supabase
          .from("laags")
          .select(`
            *,
            group:groups!group_id(
              id,
              group_name,
              group_picture
            ),
            laagAttendees!inner(
              id,
              attendee_id,
              is_removed
            )
          `)
          .eq("status", "Planning")
          .eq("is_deleted", false)
          .eq("laagAttendees.attendee_id", user?.id ?? '')
          .eq("laagAttendees.is_removed", false)
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
    <Card className="w-[300px]">
      <CardHeader className="space-y-1 pb-2 pt-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Upcoming Laags</CardTitle>
          <Badge variant="secondary" className="text-xs">{upcomingLaags.length} total</Badge>
        </div>
        <CardDescription className="text-xs">Your planned laags across all groups</CardDescription>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <ScrollArea className="h-[400px]">
          <div className="pr-3">
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-3.5 w-[150px]" />
                      <Skeleton className="h-3.5 w-[120px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : upcomingLaags.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Calendar className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm font-medium">No upcoming laags</p>
                <p className="text-xs text-muted-foreground">
                  When you plan new laags, they&apos;ll appear here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {visibleLaags.map((laag) => (
                  <UpcomingLaagRow key={laag.id} laag={laag} />
                ))}
                {hasMoreLaags && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => setDisplayCount(prev => prev + 5)}
                  >
                    Show more laags
                  </Button>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}