"use client"

import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface CommentInputProps {
  initialValue?: string
  onSubmit: (comment: string) => Promise<void>
  onCancel?: () => void
  isSubmitting?: boolean
}

export function CommentInput({
  initialValue = "",
  onSubmit,
  onCancel,
  isSubmitting = false
}: CommentInputProps) {
  const [comment, setComment] = useState(initialValue)
  const maxLength = 250

  const handleSubmit = async () => {
    if (comment.length > maxLength) {
      toast.error(`Comment must be ${maxLength} characters or less`)
      return
    }
    await onSubmit(comment)
  }

  return (
    <div className="space-y-3">
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder={`Write your comment here (max ${maxLength} characters)...`}
        rows={3}
        maxLength={maxLength}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {comment.length}/{maxLength} characters
        </span>
        <div className="flex gap-2">
          {onCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting || !comment.trim() || comment.length > maxLength}
          >
            {isSubmitting ? "Posting..." : "Post"}
          </Button>
        </div>
      </div>
    </div>
  )
}