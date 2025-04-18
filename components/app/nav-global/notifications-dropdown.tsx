import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/utils/supabase/client"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { useAvatar } from "@/hooks/useAvatar"
// import { useGroupPicture } from "@/hooks/useGroupPicture"
// import Image from "next/image"
import { ScrollArea } from "@/components/ui/scroll-area"

interface NotificationCardProps {
  notification: any;
  onClick: () => void;
  isUnread: boolean;
}

function NotificationCard({ notification, onClick, isUnread }: NotificationCardProps) {
  const organizerAvatarUrl = useAvatar(notification.notification.laag.organizer.avatar_url)

  const getNotificationMessage = (status: string) => {
    switch (status) {
      case "Planning":
        return "is planning a new laag:"
      case "Completed":
        return "has completed a laag:"
      case "Cancelled":
        return "has cancelled the laag:"
      default:
        return "has updated the laag:"
    }
  }

  return (
    <DropdownMenuItem
      key={notification.id}
      className={`p-3 ${isUnread ? 'bg-muted/50' : ''}`}
      onClick={onClick}
    >
      <div className="flex gap-3 max-w-[calc(320px-2rem)]">
        <Avatar className="h-8 w-8 flex-shrink-0 border">
          <AvatarImage src={organizerAvatarUrl || undefined} />
          <AvatarFallback>
            {notification.notification.laag.organizer.full_name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-1 min-w-0 flex-1">
          <p className="text-sm leading-tight break-words">
            <span className="font-medium">
              {notification.notification.laag.organizer.full_name}
            </span>{" "}
            {getNotificationMessage(notification.notification.laag_status)}
            <span className="font-medium"> {notification.notification.laag.what.length > 15 
              ? `${notification.notification.laag.what.slice(0, 15)}...` 
              : notification.notification.laag.what}</span>
          </p>
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground truncate">
              in <span className="font-medium">{notification.notification.group.group_name}</span>
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            {format(new Date(notification.notification.created_at), "MMM d, yyyy 'at' h:mm a")}
          </p>
        </div>
      </div>
    </DropdownMenuItem>
  );
}

export function NotificationsDropdown({ userId }: { userId: string }) {
  const router = useRouter()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [displayCount, setDisplayCount] = useState(5)
  const supabase = createClient()

  const fetchNotifications = async () => {
    const { data, error } = await supabase
      .from("laagNotificationReads")
      .select(`
        id,
        is_read,
        read_at,
        notification: laagNotifications!inner (
          id,
          created_at,
          laag_status,
          group_id,
          laag_id,
          group: groups!inner (
            id,
            group_name
          ),
          laag: laags!inner (
            what,
            privacy,
            organizer: profiles!inner (
              id,
              full_name,
              avatar_url
            )
          )
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching notifications:", error);
      return;
    }

    console.log("Fetched notifications:", data);
    setNotifications(data || []);
    setUnreadCount(data?.filter(n => !n.is_read).length || 0);
  };

  const markAsRead = async (readId: string) => {
    await supabase
      .from("laagNotificationReads")
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq("id", readId);

    fetchNotifications();
  };

  useEffect(() => {
    fetchNotifications();
    
    // Subscribe to new notifications
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'laagNotificationReads',
        filter: `user_id=eq.${userId}`
      }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const handleNotificationClick = async (notification: any) => {
    // Mark as read
    await markAsRead(notification.id);

    // Determine the route based on laag privacy
    const route = notification.notification.laag.privacy === "public"
      ? `/user/groups/${notification.notification.group_id}/laags/${notification.notification.laag_id}?from=group`
      : `/user/groups/${notification.notification.group_id}/laags/${notification.notification.laag_id}?from=group`;

    // Navigate to the laag details
    router.push(route);
  };

  const handleShowMore = () => {
    setDisplayCount(prev => prev + 10)
  }

  const visibleNotifications = notifications.slice(0, displayCount)
  const hasMoreNotifications = notifications.length > displayCount

  // Add this new function inside NotificationsDropdown component
  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from("laagNotificationReads")
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq("user_id", userId)
        .eq("is_read", false);

      if (error) throw error;
      
      fetchNotifications();
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        {unreadCount > 0 && (
          <div 
            className="p-2 text-center text-sm text-muted-foreground hover:text-foreground cursor-pointer border-b"
            onClick={(e) => {
              e.preventDefault()
              markAllAsRead()
            }}
          >
            Mark all as read
          </div>
        )}
        <ScrollArea className="h-[32rem] w-full">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-8">
              <div className="relative w-48 h-48 mb-4">
                <Image
                  src="/no-notifications.svg"
                  alt="No notifications available"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="p-4 text-center text-sm text-muted-foreground">
                No notifications
              </div>
          </div>
            
          ) : (
            <>
              {visibleNotifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onClick={() => handleNotificationClick(notification)}
                  isUnread={!notification.is_read}
                />
              ))}
              {hasMoreNotifications && (
                <div 
                  className="p-2 text-center text-sm text-muted-foreground hover:text-foreground cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault()
                    handleShowMore()
                  }}
                >
                  Show more notifications
                </div>
              )}
            </>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}