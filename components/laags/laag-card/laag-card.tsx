"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import type { LaagCardProps } from "@/types"
import { LaagCardHeader } from "./laag-card-header"
import { LaagCardContent } from "./laag-card-content"
import { LaagCardFooter } from "./laag-card-footer"

const cardClasses = `
  w-full
  overflow-hidden 
  transition-all 
  hover:shadow-md
`

export function LaagCard({ laag, members = [] }: LaagCardProps) {
  const [isOrganizer, setIsOrganizer] = useState(false)
  const [showCommentInput, setShowCommentInput] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAllComments, setShowAllComments] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const checkOrganizer = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setIsOrganizer(user?.id === laag.organizer.id)
    }
    checkOrganizer()
  }, [laag.organizer.id, supabase])

  const handleDelete = async () => {
    try {
      const { error } = await supabase.from("laags").update({ is_deleted: true }).eq("id", laag.id)

      if (error) throw error

      toast.success("Laag deleted successfully")
      window.location.reload()
    } catch (error) {
      console.error("Error deleting laag:", error)
      toast.error("Failed to delete laag")
    }
  }

  const handleCommentSubmit = async (comment: string) => {
    setIsSubmitting(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
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
      setIsSubmitting(false)
    }
  }

  const filteredComments = (laag.comments || [])
    .filter((c) => !c.is_deleted)
    .map((comment) => ({
      ...comment,
      user: comment.user || {
        // Fallback in case user data is missing
        id: comment.user_id,
        full_name: "Unknown User",
        avatar_url: null,
      },
    }))

  const commentCount = filteredComments.length

  return (
    <Card className={cardClasses}>
      <LaagCardHeader laag={laag} isOrganizer={isOrganizer} onDelete={handleDelete} />

      <LaagCardContent laag={laag} />

      <LaagCardFooter
        laag={laag}
        commentCount={commentCount}
        showCommentInput={showCommentInput}
        setShowCommentInput={setShowCommentInput}
        showAllComments={showAllComments}
        setShowAllComments={setShowAllComments}
        isSubmitting={isSubmitting}
        filteredComments={filteredComments}
        onCommentSubmit={handleCommentSubmit}
      />
    </Card>
  )
}
