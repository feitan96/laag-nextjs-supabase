"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { useParams } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarRange, MapPin, DollarSign, Smile, ArrowLeft, Trash2, Edit2, MessageSquare } from "lucide-react"
import { useAvatar } from "@/hooks/useAvatar"
import { useLaagImage } from "@/hooks/useLaagImage"
import Image from "next/image"
import { format } from "date-fns"
import { EditLaagDialog } from "../../edit-laag-dialog"
import Link from "next/link"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { CommentCard } from "../../comment-card"

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
  privacy: string
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
    attendee: {
      id: string
      full_name: string
      avatar_url: string | null
    }
  }[]
  comments: Comment[]
}

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

function AttendeeAvatar({ attendee }: { attendee: Laag["laagAttendees"][0]["attendee"] }) {
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
  const supabase = createClient()

  const organizerAvatarUrl = useAvatar(laag?.organizer.avatar_url || null)
  const filteredImages = laag?.laagImages.filter(img => !img.is_deleted) || []
  const activeAttendees = laag?.laagAttendees.filter(attendee => !attendee.is_removed) || []

  useEffect(() => {
    // Check if we're viewing from public feed
    const searchParams = new URLSearchParams(window.location.search)
    setIsPublicView(searchParams.get('from') === 'public')
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
            comments(*)
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
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setIsOrganizer(user?.id === laag?.organizer.id)
    }
    if (laag) {
      checkOrganizer()
    }
  }, [laag?.organizer.id, supabase])

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from("laags")
        .update({ is_deleted: true })
        .eq("id", params.laagId)

      if (error) throw error

      toast.success("Laag deleted successfully")
      // Navigate back to the appropriate feed
      if (isPublicView) {
        window.location.href = '/user/feed'
      } else {
        window.location.href = `/user/groups/${params.id}`
      }
    } catch (error) {
      console.error("Error deleting laag:", error)
      toast.error("Failed to delete laag")
    }
  }

  const handleBack = () => {
    if (isPublicView) {
      window.location.href = '/user/feed'
    } else {
      window.location.href = `/user/groups/${params.id}`
    }
  }

  if (loading) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-96 bg-muted rounded" />
          <div className="space-y-4">
            <div className="h-4 w-3/4 bg-muted rounded" />
            <div className="h-4 w-1/2 bg-muted rounded" />
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
    <div className="container max-w-4xl py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">{laag.what}</h1>
        </div>
        {isOrganizer && (
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
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* Images */}
          {filteredImages.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Photos</h2>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {filteredImages.map((image) => (
                    <div key={image.id} className="relative aspect-square">
                      <LaagImage imagePath={image.image} />
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

              <div>
                <h3 className="font-medium mb-2">Description</h3>
                <p className="whitespace-pre-wrap text-muted-foreground">{laag.why}</p>
              </div>

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

              <div>
                <h3 className="font-medium mb-2">Fun Meter</h3>
                <div className="flex items-center gap-2">
                  <Smile className="h-4 w-4 text-muted-foreground" />
                  <span>{laag.fun_meter}/10</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          {/* Organizer */}
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

          {/* Attendees */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Attendees</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeAttendees.map((attendee) => (
                  <AttendeeAvatar key={attendee.id} attendee={attendee.attendee} />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Status</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <Badge variant={
                laag.status.toLowerCase() === "completed" ? "default" :
                laag.status.toLowerCase() === "ongoing" ? "secondary" :
                laag.status.toLowerCase() === "cancelled" ? "destructive" :
                "outline"
              }>
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
    </div>
  )
} 