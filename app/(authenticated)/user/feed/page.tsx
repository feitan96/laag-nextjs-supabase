"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useAvatar } from "@/hooks/useAvatar"
import { useLaagImage } from "@/hooks/useLaagImage"
import Image from "next/image"
import { format } from "date-fns"
import { EditLaagDialog } from "../groups/[id]/edit-laag-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import Link from "next/link"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Trash2, CalendarRange, MapPin, DollarSign, Smile, Clock, ImageIcon, MoreHorizontal, MessageSquare, Edit2 } from "lucide-react"
import { toast } from "sonner"

interface Laag {
  id: string
  what: string
  where: string
  why: string
  estimated_cost: number
  actual_cost: number | null
  status: string
  when_start: string
  when_end: string
  fun_meter: number
  created_at: string
  updated_at: string
  group_id: string
  organizer: {
    id: string
    full_name: string
    avatar_url: string | null
  }
  laagImages: {
    id: string
    laag_id: string
    image: string
    created_at: string
    is_deleted: boolean
  }[]
  laagAttendees: {
    id: string
    attendee_id: string
    is_removed: boolean
  }[]
  comments: {
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
  }[]
}

interface LaagCardProps {
  laag: Laag
}

interface LaagImageProps {
  imagePath: string
  onClick?: () => void
  priority?: boolean
}

function LaagImage({ imagePath, onClick, priority = false }: LaagImageProps) {
  const imageUrl = useLaagImage(imagePath)

  return (
    <div className="relative aspect-square rounded-md overflow-hidden cursor-pointer">
      {imageUrl ? (
        <Image
          src={imageUrl || "/placeholder.svg"}
          alt="Laag image"
          fill
          priority={priority}
          className="object-cover transition-transform hover:scale-105"
          unoptimized
          onClick={onClick}
        />
      ) : (
        <div className="relative aspect-square rounded-md bg-muted flex items-center justify-center" onClick={onClick}>
          <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
        </div>
      )}
    </div>
  )
}

function ImageViewer({ imagePath }: { imagePath: string }) {
  const imageUrl = useLaagImage(imagePath)
  return (
    <Image
      src={imageUrl || "/placeholder.svg"}
      alt="Laag image"
      fill
      className="object-contain"
      unoptimized
    />
  )
}

function ImageGallery({ images }: { images: Laag["laagImages"] }) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  const filteredImages = images.filter((img) => !img.is_deleted)
  const selectedImage = selectedImageIndex !== null ? filteredImages[selectedImageIndex] : null

  if (filteredImages.length === 0) return null

  // Different layouts based on number of images
  const getImageGridClass = () => {
    switch (filteredImages.length) {
      case 1:
        return "grid-cols-1 aspect-video"
      case 2:
        return "grid-cols-2"
      case 3:
        return "grid-cols-2 grid-rows-2"
      case 4:
        return "grid-cols-2 grid-rows-2"
      default:
        return "grid-cols-3 grid-rows-3"
    }
  }

  return (
    <>
      <div className={`grid gap-1 ${getImageGridClass()}`}>
        {filteredImages.slice(0, 9).map((image, index) => {
          // Special styling for the first image when there are 3 images
          const isSpecialFirstImage = filteredImages.length === 3 && index === 0

          // Show "View more" overlay on the last visible image if there are more than 9
          const showMoreOverlay = index === 8 && filteredImages.length > 9

          return (
            <div key={image.id} className={`relative ${isSpecialFirstImage ? "col-span-2 row-span-1" : ""}`}>
              <LaagImage imagePath={image.image} onClick={() => setSelectedImageIndex(index)} priority={index === 0} />

              {showMoreOverlay && (
                <div
                  className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-md cursor-pointer"
                  onClick={() => setSelectedImageIndex(index)}
                >
                  <div className="text-white text-center">
                    <p className="text-xl font-bold">+{filteredImages.length - 9}</p>
                    <p className="text-sm">more photos</p>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Image Viewer Dialog */}
      <Dialog open={selectedImageIndex !== null} onOpenChange={(open) => !open && setSelectedImageIndex(null)}>
        <DialogContent className="max-w-4xl p-0 bg-background/95 backdrop-blur-sm">
          <div className="relative aspect-square sm:aspect-video w-full">
            {selectedImage && <ImageViewer imagePath={selectedImage.image} />}
          </div>
          <div className="p-4 flex justify-between items-center">
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                setSelectedImageIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : filteredImages.length - 1))
              }
            >
              <span className="sr-only">Previous</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </Button>
            <span className="text-sm">
              {selectedImageIndex !== null ? selectedImageIndex + 1 : 0} / {filteredImages.length}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                setSelectedImageIndex((prev) => (prev !== null && prev < filteredImages.length - 1 ? prev + 1 : 0))
              }
            >
              <span className="sr-only">Next</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

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

function CommentCard({ comment, onDelete }: CommentCardProps) {
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

function LaagCard({ laag }: LaagCardProps) {
  const organizerAvatarUrl = useAvatar(laag.organizer.avatar_url)
  const [isOrganizer, setIsOrganizer] = useState(false)
  const [showCommentInput, setShowCommentInput] = useState(false)
  const [newComment, setNewComment] = useState("")
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

  // Get status badge variant based on status
  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "planned":
        return "outline"
      case "ongoing":
        return "secondary"
      case "completed":
        return "default"
      case "cancelled":
        return "destructive"
      default:
        return "outline"
    }
  }

  const filteredComments = laag.comments?.filter(c => !c.is_deleted) || []
  const commentCount = filteredComments.length

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
          <Link href={`/user/groups/${laag.group_id}/laags/${laag.id}?from=public`}>
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
                  <EditLaagDialog laag={laag} members={[]} onLaagUpdated={() => window.location.reload()} />
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

        {/* Images Gallery */}
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
        </div>

        {/* Comments Section */}
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
            <Link href={`/user/groups/${laag.group_id}/laags/${laag.id}?from=public`}>
              <Button variant="outline" size="sm">
                View
              </Button>
            </Link>
          </div>

          {/* Comment Input */}
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

          {/* Comments List */}
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

export default function PublicFeed() {
  const [laags, setLaags] = useState<Laag[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchLaags = async () => {
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
          .eq("is_deleted", false)
          .eq("privacy", "public")
          .order("created_at", { ascending: false })

        if (error) throw error
        setLaags(data)
      } catch (error) {
        console.error("Error fetching laags:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchLaags()
  }, [supabase])

  if (loading) {
    return (
      <div className="container max-w-[680px] py-6 space-y-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[180px]" />
                  <Skeleton className="h-3 w-[120px]" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-0">
              <Skeleton className="h-6 w-[70%] mb-3" />
              <Skeleton className="h-4 w-[40%] mb-3" />
              <Skeleton className="h-20 w-full mb-4" />
              <div className="grid grid-cols-2 gap-3 mb-4">
                <Skeleton className="h-16 rounded-lg" />
                <Skeleton className="h-16 rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <Skeleton className="aspect-square rounded-md" />
                <Skeleton className="aspect-square rounded-md" />
              </div>
            </CardContent>
            <CardFooter className="pt-4">
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-32 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }

  if (laags.length === 0) {
    return (
      <div className="container max-w-[680px] py-6">
        <Card className="flex h-[200px] items-center justify-center border-dashed bg-muted/20">
          <div className="text-center">
            <p className="text-muted-foreground mb-2">No public laags yet</p>
            <p className="text-xs text-muted-foreground">Be the first to create one!</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-[680px] py-6 space-y-6">
      <h1 className="text-3xl font-bold">Public Laags</h1>
      {laags.map((laag) => (
        <LaagCard key={laag.id} laag={laag} />
      ))}
    </div>
  )
} 