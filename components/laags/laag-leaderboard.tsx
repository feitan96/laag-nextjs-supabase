"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAvatar } from "@/hooks/useAvatar"
import { createClient } from "@/utils/supabase/client"

interface Attendee {
  id: string
  profile: {
    id: string
    full_name: string
    avatar_url?: string | null
  }
  laag_count: number
}

interface LaagLeaderboardProps {
  className?: string
}

function AttendeeAvatar({ avatarUrl, fullName }: { avatarUrl: string | null, fullName: string }) {
  const attendeeAvatarUrl = useAvatar(avatarUrl)
  return (
    <Avatar>
      <AvatarImage src={attendeeAvatarUrl || undefined} />
      <AvatarFallback>{fullName.charAt(0)}</AvatarFallback>
    </Avatar>
  )
}

export function LaagLeaderboard({ className }: LaagLeaderboardProps) {
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [displayCount, setDisplayCount] = useState(5)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchAttendees = async () => {
      try {
        const { data, error } = await supabase
          .from('laagAttendees')
          .select(`
            id,
            profile:profiles!attendee_id(
              id,
              full_name,
              avatar_url
            )
          `)
          .eq('is_removed', false)

        if (error) throw error

        // Count laags per attendee
        const attendeeCounts = data.reduce((acc, curr) => {
          const profileId = curr.profile.id
          acc[profileId] = acc[profileId] || {
            id: curr.id,
            profile: curr.profile,
            laag_count: 0
          }
          acc[profileId].laag_count++
          return acc
        }, {} as Record<string, Attendee>)

        // Convert to array and sort by count
        const sortedAttendees = Object.values(attendeeCounts).sort(
          (a, b) => b.laag_count - a.laag_count
        )

        setAttendees(sortedAttendees)
      } catch (error) {
        console.error('Error fetching attendees:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAttendees()
  }, [supabase])

  // Filter attendees based on search query
  const filteredAttendees = attendees.filter(attendee =>
    attendee.profile.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Get visible attendees based on display count
  const visibleAttendees = filteredAttendees.slice(0, displayCount)
  const hasMoreAttendees = filteredAttendees.length > displayCount

  const handleShowMore = () => {
    setDisplayCount(prev => prev + 5)
  }

  return (
    <Card className={`overflow-hidden w-full max-w-md ${className}`}>
      <CardHeader className="px-4">
        <CardTitle className="flex items-center justify-between">
          <span>Laag Leaderboard</span>
          <Badge variant="secondary">{attendees.length} total</Badge>
        </CardTitle>
        <CardDescription>Members ranked by laags attended</CardDescription>
        <div className="relative mt-2">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent className="px-4">
        <ScrollArea className="h-[400px] pr-4 custom-scrollbar">
          <div className="space-y-3">
            {/* Top Attendee - Highlighted */}
            {attendees.length > 0 && (
              <div className="bg-primary/10 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-primary mb-3">Top Attendee</h3>
                <div className="flex items-center gap-3">
                  <AttendeeAvatar
                    avatarUrl={attendees[0].profile.avatar_url || null}
                    fullName={attendees[0].profile.full_name}
                  />
                  <div className="flex-1">
                    <p className="font-medium">{attendees[0].profile.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {attendees[0].laag_count} laags attended
                    </p>
                  </div>
                  <Badge variant="secondary" className="ml-auto">
                    #1
                  </Badge>
                </div>
              </div>
            )}

            {/* Other Attendees */}
            {visibleAttendees.slice(1).map((attendee, index) => (
              <div key={attendee.id} className="flex items-center gap-3 p-3 rounded-lg border">
                <AttendeeAvatar
                  avatarUrl={attendee.profile.avatar_url || null}
                  fullName={attendee.profile.full_name}
                />
                <div className="flex-1">
                  <p className="font-medium">{attendee.profile.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {attendee.laag_count} laags attended
                  </p>
                </div>
                <Badge variant="outline" className="ml-auto">
                  #{index + 2}
                </Badge>
              </div>
            ))}

            {hasMoreAttendees && (
              <Button
                variant="ghost"
                className="w-full text-sm text-muted-foreground hover:text-foreground"
                onClick={handleShowMore}
              >
                Show more members
              </Button>
            )}

            {searchQuery && filteredAttendees.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">
                No members found matching &quot;{searchQuery}&quot;
              </p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}