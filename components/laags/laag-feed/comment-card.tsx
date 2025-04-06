"use client"

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAvatar } from "@/hooks/useAvatar"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Clock, MoreHorizontal, Trash2, Pencil } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { CommentCardProps } from "@/types"
import { Textarea } from "@/components/ui/textarea"

export function CommentCard({ comment, onDelete }: CommentCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedComment, setEditedComment] = useState(comment.comment)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClient()
  const userAvatarUrl = useAvatar(comment.user?.avatar_url || null)

  const handleUpdate = async () => {
    if (!editedComment.trim() || editedComment === comment.comment) {
      setIsEditing(false)
      return
    }

    if (editedComment.length > 250) {
      toast.error("Comment must be 250 characters or less")
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from("comments")
        .update({ 
          comment: editedComment.trim(),
          updated_at: new Date().toISOString()
        })
        .eq("id", comment.id)

      if (error) throw error

      toast.success("Comment updated successfully")
      setIsEditing(false)
      onDelete() // This will trigger a refresh
    } catch (error) {
      console.error("Error updating comment:", error)
      toast.error("Failed to update comment")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from("comments")
        .update({ is_deleted: true })
        .eq("id", comment.id)

      if (error) throw error

      toast.success("Comment deleted successfully")
      onDelete()
    } catch (error) {
      console.error("Error deleting comment:", error)
      toast.error("Failed to delete comment")
    }
  }

  if (!comment.user) return null

  return (
    <div className="flex gap-3">
      <Avatar className="h-8 w-8 border">
        <AvatarImage src={userAvatarUrl || undefined} />
        <AvatarFallback>{comment.user.full_name.charAt(0)}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0"> {/* Added min-w-0 to prevent overflow */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0"> {/* Added min-w-0 here too */}
            <p className="text-sm font-medium truncate">{comment.user.full_name}</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">
                {format(new Date(comment.created_at), "MMM d, yyyy 'at' h:mm a")}
                {comment.updated_at && comment.updated_at !== comment.created_at && (
                  <span className="text-muted-foreground/80"> (edited)</span>
                )}
              </span>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditing(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
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
                    <AlertDialogTitle>Delete Comment</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this comment? This action cannot be undone.
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
        </div>

        {isEditing ? (
          <div className="mt-2 space-y-2">
            <Textarea
              value={editedComment}
              onChange={(e) => setEditedComment(e.target.value)}
              placeholder="Edit your comment..."
              rows={3}
              maxLength={250}
              className="w-full"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {editedComment.length}/250 characters
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false)
                    setEditedComment(comment.comment)
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleUpdate} 
                  disabled={isSubmitting || !editedComment.trim() || editedComment.length > 250}
                >
                  {isSubmitting ? "Updating..." : "Update"}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-2 p-3 bg-muted/50 rounded-lg"> {/* Added container with background */}
            <p className="text-sm break-words whitespace-pre-wrap">
              {comment.comment}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}