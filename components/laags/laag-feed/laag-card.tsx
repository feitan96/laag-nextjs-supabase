"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useAvatar } from "@/hooks/useAvatar"
import { format } from "date-fns"
import { EditLaagDialog } from "../edit-laag-dialog"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { CalendarRange, MapPin, DollarSign, Smile, Clock, MoreHorizontal, Trash2, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { LaagCardProps } from "@/types"
import { getStatusVariant } from "@/services/laags"
import { ImageGallery } from "./image-gallery"
import { CommentCard } from "./comment-card"

export function LaagCard({ laag, members = [] }: LaagCardProps) {
  const organizerAvatarUrl = useAvatar(laag.organizer.avatar_url)
  const [isOrganizer, setIsOrganizer] = useState(false)
  const [showCommentInput, setShowCommentInput] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAllComments, setShowAllComments] = useState(false)
  const supabase = createClient()

  const getLaagViewLink = () => {
    if (laag.privacy === "public") {
      return `/user/laags/${laag.id}`
    }
    return `/user/groups/${laag.group_id}/laags/${laag.id}?from=group`
  }

  useEffect(() => {
    const checkOrganizer = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setIsOrganizer(user?.id === laag.organizer.id)
    }
    checkOrganizer()
  }, [laag.organizer.id, supabase])

  const handleComment = async () => {
    if (!newComment.trim()) return

    setIsSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      const { error } = await supabase.from("comments").insert({
        comment: newComment.trim(),
        user_id: user.id,
        laag_id: laag.id,
      })

      if (error) throw error

      toast.success("Comment added successfully")
      setNewComment("")
      setShowCommentInput(false)
      window.location.reload()
    } catch (error) {
      console.error("Error adding comment:", error)
      toast.error("Failed to add comment")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from("laags")
        .update({ is_deleted: true })
        .eq("id", laag.id)

      if (error) throw error

      toast.success("Laag deleted successfully")
      window.location.reload()
    } catch (error) {
      console.error("Error deleting laag:", error)
      toast.error("Failed to delete laag")
    }
  }

  const filteredComments = (laag.comments || [])
  .filter(c => !c.is_deleted)
  .map(comment => ({
    ...comment,
    user: comment.user || {  // Fallback in case user data is missing
      id: comment.user_id,
      full_name: 'Unknown User',
      avatar_url: null
    }
  }));

const commentCount = filteredComments.length;

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border">
            <AvatarImage src={organizerAvatarUrl || undefined} />
            <AvatarFallback>{laag.organizer.full_name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{laag.organizer.full_name}</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{format(new Date(laag.created_at), "MMM d, yyyy 'at' h:mm a")}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href={getLaagViewLink()}>
            <Button variant="outline" size="sm">
              View
            </Button>
          </Link>
          {isOrganizer && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">More options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <EditLaagDialog 
                    laag={laag} 
                    members={members} 
                    onLaagUpdated={() => window.location.reload()} 
                  />
                </DropdownMenuItem>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                      Delete
                    </DropdownMenuItem>
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
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="pb-0">
        <h3 className="text-xl font-semibold mb-2">{laag.what}</h3>

        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
          <MapPin className="h-4 w-4 flex-shrink-0" />
          <span>{laag.where}</span>
        </div>

        {laag.why && (
          <div className="mb-4">
            <p className="whitespace-pre-wrap text-sm">{laag.why}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-lg bg-muted/50 p-3 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Estimated</p>
              <p className="font-medium">₱{laag.estimated_cost.toFixed(2)}</p>
            </div>
          </div>

          {laag.actual_cost !== null && (
            <div className="rounded-lg bg-muted/50 p-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Actual</p>
                <p className="font-medium">₱{laag.actual_cost.toFixed(2)}</p>
              </div>
            </div>
          )}
        </div>

        {laag.laagImages && laag.laagImages.filter((img) => !img.is_deleted).length > 0 && (
          <div className="mb-4">
            <ImageGallery images={laag.laagImages} />
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-4 pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={getStatusVariant(laag.status)}>{laag.status}</Badge>

          <Badge variant="outline" className="flex items-center gap-1">
            <CalendarRange className="h-3 w-3" />
            <span>
              {format(new Date(laag.when_start), "MMM d")} - {format(new Date(laag.when_end), "MMM d")}
            </span>
          </Badge>

          <Badge variant="outline" className="flex items-center gap-1">
            <Smile className="h-3 w-3" />
            <span>Fun: {laag.fun_meter}/10</span>
          </Badge>

          <Badge variant="outline">
            {laag.privacy === "public" ? "Public" : "Group Only"}
          </Badge>
        </div>

        <div className="w-full space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setShowCommentInput(!showCommentInput)}
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 p-0"
                onClick={() => setShowAllComments(!showAllComments)}
              >
                <span className="text-sm text-muted-foreground">
                  {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
                </span>
              </Button>
            </div>
          </div>

          {showCommentInput && (
            <div className="space-y-2">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="w-full p-2 text-sm border rounded-md"
                rows={2}
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowCommentInput(false)
                    setNewComment("")
                  }}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={handleComment} disabled={isSubmitting}>
                  {isSubmitting ? "Posting..." : "Post"}
                </Button>
              </div>
            </div>
          )}

          {showAllComments && filteredComments.length > 0 && (
            <div className="border-t pt-4 space-y-4">
              {filteredComments.map((comment) => (
                <CommentCard
                  key={comment.id}
                  comment={comment}
                  onDelete={() => window.location.reload()}
                />
              ))}
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  )
} 