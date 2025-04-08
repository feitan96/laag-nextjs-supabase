"use client"

import { Button } from "@/components/ui/button"
import { CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Laag } from "@/types"
import { CalendarRange, MessageSquare, Smile } from "lucide-react"
import { format } from "date-fns"
import { getStatusVariant } from "@/services/laags"
import { CommentInput } from "../comment-input"
import { CommentCard } from "../comment-card"
import type { Dispatch, SetStateAction } from "react"

interface LaagCardFooterProps {
  laag: Laag
  commentCount: number
  showCommentInput: boolean
  setShowCommentInput: Dispatch<SetStateAction<boolean>>
  showAllComments: boolean
  setShowAllComments: Dispatch<SetStateAction<boolean>>
  isSubmitting: boolean
  filteredComments: any[]
  onCommentSubmit: (comment: string) => Promise<void>
}

export function LaagCardFooter({
  laag,
  commentCount,
  showCommentInput,
  setShowCommentInput,
  showAllComments,
  setShowAllComments,
  isSubmitting,
  filteredComments,
  onCommentSubmit,
}: LaagCardFooterProps) {
  return (
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

        <Badge variant="outline">{laag.privacy === "public" ? "Public" : "Group Only"}</Badge>
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
            <Button variant="ghost" size="sm" className="h-8 p-0" onClick={() => setShowAllComments(!showAllComments)}>
              <span className="text-sm text-muted-foreground">
                {commentCount} {commentCount === 1 ? "comment" : "comments"}
              </span>
            </Button>
          </div>
        </div>

        {showCommentInput && (
          <CommentInput
            onSubmit={onCommentSubmit}
            onCancel={() => setShowCommentInput(false)}
            isSubmitting={isSubmitting}
          />
        )}

        {showAllComments && filteredComments.length > 0 && (
          <div className="border-t pt-4 space-y-4">
            {filteredComments.map((comment) => (
              <CommentCard key={comment.id} comment={comment} onDelete={() => window.location.reload()} />
            ))}
          </div>
        )}
      </div>
    </CardFooter>
  )
}
