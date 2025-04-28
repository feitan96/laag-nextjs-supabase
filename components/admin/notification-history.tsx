"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format } from "date-fns"
import { useAvatar } from "@/hooks/useAvatar"
import { useRouter } from "next/navigation"
import { Bell } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

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
      className="flex gap-4 p-4 hover:bg-secondary/20 rounded-lg cursor-pointer transition-colors duration-200 group"
      onClick={handleClick}
    >
      <Avatar className="h-10 w-10 flex-shrink-0 border-secondary/20 shadow-sm group-hover:ring-1 ring-primary/20 transition-all">
        <AvatarImage src={organizerAvatarUrl || undefined} />
        <AvatarFallback className="bg-primary/10 text-primary">
          {notification.laag.organizer.full_name.charAt(0)}
        </AvatarFallback>
      </Avatar>
      <div className="space-y-1.5 min-w-0 flex-1">
        <p className="text-sm leading-tight break-words">
          <span className="font-medium text-foreground">{notification.laag.organizer.full_name}</span>{" "}
          <span className="text-muted-foreground">{getNotificationMessage(notification.laag_status)}</span>
          <span className="font-medium text-foreground"> {notification.laag.what}</span>
        </p>
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground truncate">
            in <span className="font-medium text-foreground/80">{notification.group.group_name}</span>
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
    <Card className="overflow-hidden border-secondary/20 bg-card shadow-md">
      <CardHeader className="bg-secondary/10 pb-4">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <CardTitle>Activity History</CardTitle>
        </div>
        <CardDescription>Recent activities across all groups</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="p-4 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-10 w-10 rounded-full bg-secondary/20" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4 bg-secondary/20" />
                    <Skeleton className="h-3 w-1/2 bg-secondary/20" />
                    <Skeleton className="h-3 w-1/4 bg-secondary/20" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
              <Bell className="h-12 w-12 text-muted-foreground/50 mb-2" />
              <p>No activities found</p>
            </div>
          ) : (
            <div className="divide-y divide-secondary/10">
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
