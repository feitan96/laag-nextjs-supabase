"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { useSearchParams } from "next/navigation"
import { useRouter } from "next/navigation"
import { Laag } from "@/types"
import { LaagCard } from "./laag-feed/laag-card"
import { CommentCard } from "./comment-card"
import { Button } from "@/components/ui/button"
import { MessageSquare } from "lucide-react"
import { toast } from "sonner"

export function LaagDetails() {
  const [laag, setLaag] = useState<Laag | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCommentInput, setShowCommentInput] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchLaag = async () => {
      const laagId = searchParams.get("id")
      if (!laagId) {
        router.push("/user/feed")
        return
      }

      try {
        const { data, error } = await supabase
          .from("laags")
          .select(`
            *,
            organizer:profiles!organizer(id, full_name, avatar_url),
            laagImages(*),
            laagAttendees(*),
            comments(
              id,
              comment,
              created_at,
              updated_at,
              user_id,
              laag_id,
              is_deleted,
              user:profiles(id, full_name, avatar_url)
            )
          `)
          .eq("id", laagId)
          .single()

        if (error) throw error
        setLaag(data)
      } catch (error) {
        console.error("Error fetching laag:", error)
        toast.error("Failed to load laag details")
      } finally {
        setLoading(false)
      }
    }

    fetchLaag()
  }, [searchParams, router, supabase])

  const handleComment = async () => {
    if (!newComment.trim() || !laag) return

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

  if (loading) {
    return <div>Loading...</div>
  }

  if (!laag) {
    return <div>Laag not found</div>
  }

  const filteredComments = laag.comments?.filter(c => !c.is_deleted) || []

  return (
    <div className="container max-w-[680px] py-6 space-y-6">
      <LaagCard laag={laag} members={[]} />

      {/* Comments Section */}
      <div className="space-y-4">
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
            <span className="text-sm text-muted-foreground">
              {filteredComments.length} {filteredComments.length === 1 ? 'comment' : 'comments'}
            </span>
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

        {filteredComments.length > 0 && (
          <div className="space-y-4">
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
    </div>
  )
} 