"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { useParams } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarRange, MapPin, DollarSign, Smile, ArrowLeft, Trash2, MessageSquare } from "lucide-react"
import { useAvatar } from "@/hooks/useAvatar"
import { useLaagImage } from "@/hooks/useLaagImage"
import Image from "next/image"
import { format } from "date-fns"
import { EditLaagDialog } from "../../../../../../../components/laags/edit-laag-dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { CommentCard } from "@/components/laags/comment-card"
import { CompleteLaagDialog } from "@/components/laags/complete-laag-dialog"
import { Laag } from "@/types"
import { Textarea } from "@/components/ui/textarea"
import { CommentInput } from "@/components/laags/comment-input"

function LaagImage({ imagePath }: { imagePath: string }) {
  const imageUrl = useLaagImage(imagePath)
  return (
    <Image
      src={imageUrl || "/placeholder.svg"}
      alt="Laag image"
      fill
      className="rounded-lg object-cover"
    />
  )
}

function AttendeeAvatar({ attendee }: { attendee: { id: string; full_name: string; avatar_url: string | null } }) {
  const avatarUrl = useAvatar(attendee.avatar_url)
  return (
    <div className="flex items-center gap-3">
      <Avatar>
        <AvatarImage src={avatarUrl || undefined} />
        <AvatarFallback>{attendee.full_name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div>
        <p className="font-medium">{attendee.full_name}</p>
      </div>
    </div>
  )
}

export default function LaagDetails() {
  const params = useParams()
  const [laag, setLaag] = useState<Laag | null>(null)
  const [loading, setLoading] = useState(true)
  const [isOrganizer, setIsOrganizer] = useState(false)
  const [isPublicView, setIsPublicView] = useState(false)
  const [showCompleteDialog, setShowCompleteDialog] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [showCommentInput, setShowCommentInput] = useState(false)
  const supabase = createClient()

  const organizerAvatarUrl = useAvatar(laag?.organizer.avatar_url || null)
  const filteredImages = laag?.laagImages.filter(img => !img.is_deleted) || []
  const activeAttendees = laag?.laagAttendees.filter(attendee => !attendee.is_removed) || []
  const filteredComments = laag?.comments.filter(c => !c.is_deleted) || []

  useEffect(() => {
    setIsPublicView(new URLSearchParams(window.location.search).get('from') === 'public')
  }, [])

  useEffect(() => {
    const fetchLaag = async () => {
      try {
        const { data, error } = await supabase
          .from("laags")
          .select(`
            *,
            organizer:profiles!organizer(id, full_name, avatar_url),
            laagImages(*),
            laagAttendees(
              id,
              attendee_id,
              is_removed,
              attendee:profiles(id, full_name, avatar_url)
            ),
            comments:comments!laag_id(
              *,
              user:profiles!user_id(id, full_name, avatar_url)
            )
          `)
          .eq("id", params.laagId)
          .eq("is_deleted", false)
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
  }, [params.laagId, supabase])

  useEffect(() => {
    const checkOrganizer = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setIsOrganizer(user?.id === laag?.organizer.id)
    }
    if (laag) checkOrganizer()
  }, [laag?.organizer.id, supabase])

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from("laags")
        .update({ is_deleted: true })
        .eq("id", params.laagId)

      if (error) throw error

      toast.success("Laag deleted successfully")
      window.location.href = isPublicView ? '/user/feed' : `/user/groups/${params.id}`
    } catch (error) {
      console.error("Error deleting laag:", error)
      toast.error("Failed to delete laag")
    }
  }

  const handleCancelLaag = async () => {
    try {
      // Update laag status
      const { error: laagError } = await supabase
        .from("laags")
        .update({ 
          status: "Cancelled",
          updated_at: new Date().toISOString()
        })
        .eq("id", params.laagId)

      if (laagError) throw laagError

      // Create notification
      const { data: createdNotification, error: notificationError } = await supabase
        .from("laagNotifications")
        .insert({
          laag_id: params.laagId,
          laag_status: "Cancelled",
          group_id: params.id
        })
        .select('id')
        .single();

      if (notificationError) throw notificationError;
      if (!createdNotification) throw new Error("Failed to create notification");

      // Filter out invalid attendees and create notification reads
      const validAttendees = activeAttendees.filter(
        attendee => attendee?.attendee?.id
      );

      if (validAttendees.length > 0) {
        const notificationReads = validAttendees.map(attendee => ({
          notification_id: createdNotification.id,
          user_id: attendee.attendee.id,
          is_read: false
        }));

        const { error: readsError } = await supabase
          .from("laagNotificationReads")
          .insert(notificationReads);

        if (readsError) {
          console.error("Error creating notification reads:", readsError);
          // Don't throw here, as the laag is already cancelled
        }
      }

      toast.success("Laag cancelled successfully")
      window.location.reload()
    } catch (error) {
      console.error("Error cancelling laag:", error)
      toast.error("Failed to cancel laag")
    }
  }


  const handleDeleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from("comments")
        .update({ is_deleted: true })
        .eq("id", commentId)

      if (error) throw error

      toast.success("Comment deleted successfully")
      window.location.reload()
    } catch (error) {
      window.location.reload()

    }
  }

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed": return "default"
      case "ongoing": return "secondary"
      case "cancelled": return "destructive"
      default: return "outline"
    }
  }

  if (loading) {
    return (
      <div className="container max-w-5xl mx-auto py-8 px-4">
        <div className="animate-pulse space-y-8">
          {/* Header skeleton */}
          <div className="flex items-center justify-between">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="h-8 w-32 bg-muted rounded" />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content skeleton */}
            <div className="lg:col-span-2 space-y-6">
              <div className="h-96 bg-muted rounded" />
              <div className="h-64 bg-muted rounded" />
            </div>
            
            {/* Sidebar skeleton */}
            <div className="space-y-6">
              <div className="h-40 bg-muted rounded" />
              <div className="h-64 bg-muted rounded" />
              <div className="h-48 bg-muted rounded" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!laag) {
    return (
      <div className="container max-w-4xl py-8">
        <Card>
          <CardHeader>
            <CardTitle>Laag not found</CardTitle>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      {/* Header with back button and actions */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => window.location.href = isPublicView ? '/user/feed' : `/user/groups/${params.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">{laag.what}</h1>
        </div>
        {isOrganizer && (
          <div className="flex items-center gap-2">
            {laag.status === "Planning" && (
              <>
                <Button variant="outline" onClick={() => setShowCompleteDialog(true)}>
                  Complete Laag
                </Button>
                <Button variant="destructive" onClick={handleCancelLaag}>
                  Cancel Laag
                </Button>
              </>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Laag
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Laag</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this laag? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content - Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Photos */}
          {filteredImages.length > 0 && (
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader>
                <h2 className="text-xl font-semibold">Photos</h2>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredImages.map((image) => (
                    <div key={image.id} className="relative aspect-square group">
                      <LaagImage imagePath={image.image} />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Details</h2>
                {isOrganizer && (
                  <EditLaagDialog
                    laag={laag}
                    members={activeAttendees.map(attendee => ({
                      id: attendee.attendee.id,
                      group_member: attendee.attendee_id,
                      is_removed: false,
                      profile: attendee.attendee
                    }))}
                    onLaagUpdated={() => window.location.reload()}
                  />
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">Location</h3>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{laag.where}</span>
                </div>
              </div>

              {laag.why && (
                <div>
                  <h3 className="font-medium mb-2">Description</h3>
                  <p className="whitespace-pre-wrap text-muted-foreground">{laag.why}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">Estimated Cost</h3>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>₱{laag.estimated_cost.toFixed(2)}</span>
                  </div>
                </div>

                {laag.actual_cost !== null && (
                  <div>
                    <h3 className="font-medium mb-2">Actual Cost</h3>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>₱{laag.actual_cost.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-medium mb-2">Schedule</h3>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarRange className="h-4 w-4" />
                  <span>
                    {format(new Date(laag.when_start), "MMM d")} - {format(new Date(laag.when_end), "MMM d")}
                  </span>
                </div>
              </div>

              {laag.status !== "Planning" && (
                <div>
                  <h3 className="font-medium mb-2">Fun Meter</h3>
                  <div className="flex items-center gap-2">
                    <Smile className="h-4 w-4 text-muted-foreground" />
                    <span>{laag.fun_meter || "Not rated"}/10</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Comments Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Comments</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowCommentInput(!showCommentInput)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Add Comment
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {showCommentInput && (
                <CommentInput
                  onSubmit={async (comment) => {
                    setIsSubmittingComment(true)
                    try {
                      const { data: { user } } = await supabase.auth.getUser()
                      if (!user) throw new Error("User not authenticated")

                      const { error } = await supabase.from("comments").insert({
                        comment: comment.trim(),
                        user_id: user.id,
                        laag_id: laag.id,
                      })

                      if (error) throw error

                      toast.success("Comment added successfully")
                      setShowCommentInput(false)
                      window.location.reload()
                    } catch (error) {
                      console.error("Error adding comment:", error)
                      toast.error("Failed to add comment")
                    } finally {
                      setIsSubmittingComment(false)
                    }
                  }}
                  onCancel={() => {
                    setShowCommentInput(false)
                    setNewComment("")
                  }}
                  isSubmitting={isSubmittingComment}
                />
              )}

              {filteredComments.length > 0 ? (
                <div className="space-y-4">
                  {filteredComments.map((comment) => (
                    <CommentCard 
                      key={comment.id} 
                      comment={comment} 
                      onDelete={handleDeleteComment}
                      onEdit={() => window.location.reload()}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="relative w-64 h-64">
                    <Image
                      src="/no-comments.svg"
                      alt="No comments found"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="text-center py-6 text-muted-foreground">
                    No comments yet. Be the first to comment!
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Right column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Organizer</h2>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={organizerAvatarUrl || undefined} />
                  <AvatarFallback>{laag.organizer.full_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{laag.organizer.full_name}</p>
                  <p className="text-sm text-muted-foreground">Created {format(new Date(laag.created_at), "MMM d, yyyy")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {activeAttendees.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Attendees</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeAttendees
                  // Filter to show only unique attendees based on attendee_id
                  .filter((attendee, index, self) =>
                    index === self.findIndex(a => a.attendee_id === attendee.attendee_id)
                  )
                  .map((attendee) => (
                    <AttendeeAvatar 
                      key={`${attendee.attendee_id}-${attendee.id}`} // Combine attendee_id and record id for uniqueness
                      attendee={attendee.attendee} 
                    />
                  ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Status</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <Badge variant={getStatusVariant(laag.status)}>
                {laag.status}
              </Badge>
              <div>
                <h3 className="font-medium mb-2">Privacy</h3>
                <Badge variant="outline">
                  {laag.privacy === "public" ? "Public" : "Group Only"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Complete Laag Dialog */}
      {showCompleteDialog && (
        <CompleteLaagDialog
          laag={laag}
          members={activeAttendees.map(attendee => ({
            id: attendee.attendee.id,
            group_member: attendee.attendee_id,
            is_removed: false,
            profile: attendee.attendee
          }))}
          onLaagUpdated={() => window.location.reload()}
          open={showCompleteDialog}
          onOpenChange={setShowCompleteDialog}
        />
      )}
    </div>
  )
}