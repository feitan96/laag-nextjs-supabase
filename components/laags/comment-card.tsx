"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Edit2, Trash2 } from "lucide-react"
import { useAvatar } from "@/hooks/useAvatar"
import { toast } from "sonner"

interface Comment {
  id: string
  comment: string
  created_at: string
  updated_at: string
  user_id: string
  laag_id: string
  is_deleted: boolean
  user: {
    id: string
    full_name: string
    avatar_url: string | null
  }
}

interface CommentCardProps {
  comment: Comment
  onDelete: () => void
}

export function CommentCard({ comment, onDelete }: CommentCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedComment, setEditedComment] = useState(comment.comment)
  const [isUser, setIsUser] = useState(false)
  const supabase = createClient()
  const avatarUrl = useAvatar(comment.user?.avatar_url || null)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setIsUser(user?.id === comment.user_id)
    }
    checkUser()
  }, [comment.user_id, supabase])

  const handleUpdate = async () => {
    try {
      const { error } = await supabase
        .from("comments")
        .update({ comment: editedComment })
        .eq("id", comment.id)

      if (error) throw error

      toast.success("Comment updated successfully")
      setIsEditing(false)
      onDelete() // Refresh comments
    } catch (error) {
      console.error("Error updating comment:", error)
      toast.error("Failed to update comment")
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
      onDelete() // Refresh comments
    } catch (error) {
      console.error("Error deleting comment:", error)
      toast.error("Failed to delete comment")
    }
  }

  if (comment.is_deleted || !comment.user) return null

  return (
    <div className="flex gap-3 p-3 border rounded-lg">
      <Avatar className="h-8 w-8">
        <AvatarImage src={avatarUrl || undefined} />
        <AvatarFallback>{comment.user.full_name?.charAt(0) || "?"}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <p className="font-medium text-sm">{comment.user.full_name || "Unknown User"}</p>
          {isUser && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit2 className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
        {isEditing ? (
          <div className="mt-1">
            <textarea
              value={editedComment}
              onChange={(e) => setEditedComment(e.target.value)}
              className="w-full p-2 text-sm border rounded-md"
              rows={2}
            />
            <div className="flex justify-end gap-2 mt-2">
              <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleUpdate}>
                Save
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mt-1">{comment.comment}</p>
        )}
      </div>
    </div>
  )
} 