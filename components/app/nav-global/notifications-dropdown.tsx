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

interface NotificationCardProps {
  notification: any;
  onClick: () => void;
  isUnread: boolean;
}

function NotificationCard({ notification, onClick, isUnread }: NotificationCardProps) {
  const organizerAvatarUrl = useAvatar(notification.notification.laag.organizer.avatar_url)
  //const groupPictureUrl = useGroupPicture(notification.notification.group.group_picture)

  return (
    <DropdownMenuItem
      key={notification.id}
      className={`p-4 ${isUnread ? 'bg-muted/50' : ''}`}
      onClick={onClick}
    >
      <div className="flex gap-4">
        <Avatar className="h-10 w-10 border">
          <AvatarImage src={organizerAvatarUrl || undefined} />
          <AvatarFallback>
            {notification.notification.laag.organizer.full_name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-1 flex-1">
          <p className="text-sm">
            <span className="font-medium">
              {notification.notification.laag.organizer.full_name}
            </span>{" "}
            {notification.notification.laag_status === "Planning" 
              ? "is planning a new laag:" 
              : "has completed a laag:"}
            <span className="font-medium"> {notification.notification.laag.what}</span>
          </p>
          <div className="flex items-center gap-2">
            {/* <div className="relative h-4 w-4">
              <Image
                src={groupPictureUrl || "/placeholder.svg"}
                alt={notification.notification.group.group_name}
                fill
                className="object-cover rounded"
              />
            </div> */}
            <p className="text-xs text-muted-foreground">
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
  const supabase = createClient()

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from("laagNotificationReads")
      .select(`
        id,
        is_read,
        read_at,
        notification: laagNotifications (
          id,
          created_at,
          laag_status,
          group_id,
          laag_id,
          group: groups (
            id,
            group_name,
          ),
          laag: laags (
            what,
            privacy,
            organizer (
              id,
              full_name,
              avatar_url
            )
          )
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

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
      ? `/user/laags/${notification.notification.laag_id}`
      : `/user/groups/${notification.notification.group_id}/laags/${notification.notification.laag_id}?from=group`;

    // Navigate to the laag details
    router.push(route);
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
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No notifications
          </div>
        ) : (
          notifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onClick={() => handleNotificationClick(notification)}
              isUnread={!notification.is_read}
            />
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}