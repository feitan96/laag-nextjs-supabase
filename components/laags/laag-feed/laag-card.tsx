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
import { ImageGallery } from "../image-gallery"
import { CommentCard } from "../comment-card"
import { CommentInput } from "../comment-input"
import { Slider } from "@/components/ui/slider"
import { submitFunMeter, updateFunMeter, deleteFunMeter } from "@/services/laags"
import { cn } from "@/lib/utils"


const cardClasses = `
  w-full max-w-[640px] 
  overflow-hidden 
  transition-all 
  hover:shadow-md
  mx-auto  // Center the card
`

export function LaagCard({ laag, members = [] }: LaagCardProps) {
  const organizerAvatarUrl = useAvatar(laag.organizer.avatar_url)
  const [isOrganizer, setIsOrganizer] = useState(false)
  const [showCommentInput, setShowCommentInput] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAllComments, setShowAllComments] = useState(false)
  const [isAttendee, setIsAttendee] = useState(false)
  const [showFunMeter, setShowFunMeter] = useState(false)
  const [funMeterValue, setFunMeterValue] = useState<number>(0)
  const [userFunMeter, setUserFunMeter] = useState<any>(null)
  const supabase = createClient()

  const getLaagViewLink = () => {
    if (laag.privacy === "public") {
      return `/user/groups/${laag.group_id}/laags/${laag.id}?from=group`
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

  // Add this useEffect to check if user is attendee
  useEffect(() => {
    const checkAttendee = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const isUserAttendee = laag.laagAttendees.some(
        attendee => attendee.attendee_id === user.id && !attendee.is_removed
      )
      setIsAttendee(isUserAttendee)

      // Fetch user's fun meter if exists
      if (isUserAttendee) {
        const { data: funMeter } = await supabase
          .from("laagFunMeter")
          .select("*")
          .eq("laag_id", laag.id)
          .eq("user_id", user.id)
          .eq("is_deleted", false)
          .single()

        if (funMeter) {
          setUserFunMeter(funMeter)
          setFunMeterValue(funMeter.fun_meter)
        }
      }
    }
    checkAttendee()
  }, [laag.id, laag.laagAttendees, supabase])

  // Add this function to handle fun meter submission
  const handleFunMeterSubmit = async () => {
    try {
      if (userFunMeter) {
        await updateFunMeter(userFunMeter.id, funMeterValue)
      } else {
        await submitFunMeter(laag.id, laag.group_id, funMeterValue)
      }
      toast.success("Fun meter updated successfully")
      window.location.reload()
    } catch (error) {
      console.error("Error updating fun meter:", error)
      toast.error("Failed to update fun meter")
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
    <Card className={cardClasses}>
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
          {/* edit and delete if organizer */}
          {/* {isOrganizer && (
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
          )} */}
        </div>
      </CardHeader>

      <CardContent className="pb-0">
        <h3 className="text-xl font-semibold mb-2 truncate" title={laag.what}>
          {laag.what}
        </h3>
        
        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
          <MapPin className="h-4 w-4 flex-shrink-0" />
          <span className="truncate" title={laag.where}>{laag.where}</span>
        </div>
      
        {/* {laag.why && (
          <div className="mb-4">
            <p className="whitespace-pre-wrap text-sm line-clamp-3" title={laag.why}>
              {laag.why}
            </p>
          </div>
        )} */}
      
        {/* Replace the existing cost display section */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className={cn(
            "rounded-lg bg-muted/50 p-3 flex items-center gap-2",
            laag.actual_cost === null && "col-span-2" // Make it span full width if no actual cost
          )}>
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
          <div className="w-full overflow-hidden rounded-lg">
            <ImageGallery images={laag.laagImages} />
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-4 pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={getStatusVariant(laag.status)}>
            {laag.status.toLowerCase() === "cancelled" ? "Drawing" : laag.status}
          </Badge>

          {laag.status.toLowerCase() !== "cancelled" && (
            <>
              <Badge variant="outline" className="flex items-center gap-1">
                <CalendarRange className="h-3 w-3" />
                <span>
                  {format(new Date(laag.when_start), "MMM d")} - {format(new Date(laag.when_end), "MMM d")}
                </span>
              </Badge>

              {/* Add type badge here */}
              <Badge variant="outline">
                {laag.type}
              </Badge>
            </>
          )}

          {laag.status.toLowerCase() === "completed" && (
            <>
              <Badge variant="outline" className="flex items-center gap-1">
                <Smile className="h-3 w-3" />
                <span>
                  Fun: {laag.fun_meter !== null ? `${laag.fun_meter.toFixed(1)}/10` : 'No ratings yet'}
                </span>
              </Badge>

              <Badge variant="outline">
                {laag.privacy === "public" ? "Public" : "Group Only"}
              </Badge>
            </>
          )}

          {laag.status.toLowerCase() === "ongoing" && (
            <Badge variant="outline">
              {laag.privacy === "public" ? "Public" : "Group Only"}
            </Badge>
          )}
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
            <CommentInput
              onSubmit={async (comment) => {
                setIsSubmitting(true)
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
                  setIsSubmitting(false)
                }
              }}
              onCancel={() => {
                setShowCommentInput(false)
                setNewComment("")
              }}
              isSubmitting={isSubmitting}
            />
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
        {isAttendee && laag.status.toLowerCase() === "completed" && (
          <div className="w-full">
            <Button
              variant="outline"
              onClick={() => setShowFunMeter(true)}
              className="w-full"
            >
              {userFunMeter ? "Edit your fun meter" : "Rate your experience"}
            </Button>

            <AlertDialog open={showFunMeter} onOpenChange={setShowFunMeter}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Rate your experience</AlertDialogTitle>
                  <AlertDialogDescription>
                    How fun was this laag? Rate from 0 to 10
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-6">
                  <Slider
                    value={[funMeterValue]}
                    onValueChange={(value) => setFunMeterValue(value[0])}
                    max={10}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-center mt-2">Rating: {funMeterValue.toFixed(1)}</p>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleFunMeterSubmit}>
                    Submit
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}