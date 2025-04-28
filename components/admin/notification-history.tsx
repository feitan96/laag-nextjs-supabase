'use client'

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format } from "date-fns"
import { useAvatar } from "@/hooks/useAvatar"
import { useRouter } from "next/navigation"

interface NotificationHistoryProps {
  limit?: number
}

function NotificationCard({ notification }: { notification: any }) {
  const router = useRouter()
  const organizerAvatarUrl = useAvatar(notification.laag.organizer.avatar_url)

  const getNotificationMessage = (status: string) => {
    switch (status) {
      case "Planning":
        return "started planning a new laag:"
      case "Completed":
        return "completed a laag:"
      case "Cancelled":
        return "cancelled the laag:"
      default:
        return "updated the laag:"
    }
  }

  const handleClick = () => {
    router.push(`/user/groups/${notification.group.id}/laags/${notification.laag_id}?from=group`)
  }

  return (
    <div 
      className="flex gap-3 p-3 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors"
      onClick={handleClick}
    >
      <Avatar className="h-8 w-8 flex-shrink-0 border">
        <AvatarImage src={organizerAvatarUrl || undefined} />
        <AvatarFallback>
          {notification.laag.organizer.full_name.charAt(0)}
        </AvatarFallback>
      </Avatar>
      <div className="space-y-1 min-w-0 flex-1">
        <p className="text-sm leading-tight break-words">
          <span className="font-medium">
            {notification.laag.organizer.full_name}
          </span>{" "}
          {getNotificationMessage(notification.laag_status)}
          <span className="font-medium"> {notification.laag.what}</span>
        </p>
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground truncate">
            in <span className="font-medium">{notification.group.group_name}</span>
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          {format(new Date(notification.created_at), "MMM d, yyyy 'at' h:mm a")}
        </p>
      </div>
    </div>
  )
}

export function NotificationHistory({ limit = 50 }: NotificationHistoryProps) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from("laagNotifications")
          .select(`
            *,
            laag:laags!inner(
              id,
              what,
              organizer:profiles!organizer(
                id,
                full_name,
                avatar_url
              )
            ),
            group:groups!inner(
              id,
              group_name
            )
          `)
          .eq("is_deleted", false)
          .order("created_at", { ascending: false })
          .limit(limit)

        if (error) throw error
        setNotifications(data)
      } catch (error) {
        console.error("Error fetching notifications:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [limit, supabase])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity History</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No activities found
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <NotificationCard key={notification.id} notification={notification} />
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}