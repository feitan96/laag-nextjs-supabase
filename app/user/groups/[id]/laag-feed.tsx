"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useAvatar } from "@/hooks/useAvatar"
import { useLaagImage } from "@/hooks/useLaagImage"
import Image from "next/image"
import { format } from "date-fns"

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
}

interface LaagCardProps {
  laag: Laag
}

interface LaagImageProps {
  imagePath: string
}

function LaagImage({ imagePath }: LaagImageProps) {
  const imageUrl = useLaagImage(imagePath)
  
  if (!imageUrl) {
    return (
      <div className="relative aspect-square bg-muted flex items-center justify-center">
        <span className="text-muted-foreground">No image</span>
      </div>
    )
  }

  return (
    <div className="relative aspect-square">
      <Image
        src={imageUrl}
        alt="Laag image"
        fill
        className="object-cover"
        unoptimized
      />
    </div>
  )
}

function LaagCard({ laag }: LaagCardProps) {
  const organizerAvatarUrl = useAvatar(laag.organizer.avatar_url)
  
  console.log("Laag card data:", laag)
  console.log("Laag images:", laag.laagImages)
  
  return (
    <div className="rounded-lg border bg-card">
      {/* Header */}
      <div className="flex items-center gap-4 p-4">
        <Avatar>
          <AvatarImage src={organizerAvatarUrl || undefined} />
          <AvatarFallback>{laag.organizer.full_name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{laag.organizer.full_name}</p>
          <p className="text-sm text-muted-foreground">
            {format(new Date(laag.created_at), "MMM d, yyyy 'at' h:mm a")}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-4">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">{laag.what}</h3>
          <p className="text-muted-foreground">📍 {laag.where}</p>
          <p className="whitespace-pre-wrap">{laag.why}</p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-muted p-3">
            <p className="text-sm text-muted-foreground">Estimated Cost</p>
            <p className="font-medium">₱{laag.estimated_cost.toFixed(2)}</p>
          </div>
          {laag.actual_cost && (
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm text-muted-foreground">Actual Cost</p>
              <p className="font-medium">₱{laag.actual_cost.toFixed(2)}</p>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Badge variant="secondary">{laag.status}</Badge>
          <Badge variant="outline">
            {format(new Date(laag.when_start), "MMM d")} - {format(new Date(laag.when_end), "MMM d")}
          </Badge>
          <Badge variant="outline">Fun: {laag.fun_meter}/10</Badge>
        </div>
      </div>

      {/* Images */}
      {laag.laagImages && laag.laagImages.length > 0 && (
        <div className="mt-4">
          <div className="grid grid-cols-2 gap-1">
            {laag.laagImages.map((image) => (
              <LaagImage key={image.id} imagePath={image.image} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface LaagFeedProps {
  groupId: string
}

export function LaagFeed({ groupId }: LaagFeedProps) {
  const [laags, setLaags] = useState<Laag[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchLaags = async () => {
    try {
      const { data, error } = await supabase
        .from("laags")
        .select(`
          *,
          organizer:profiles!organizer(id, full_name, avatar_url),
          laagImages!laag_id(id, laag_id, image, created_at, is_deleted)
        `)
        .eq("group_id", groupId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })

      if (error) throw error
      console.log("Fetched laags data:", data)

      // Transform the data to ensure laagImages is always an array and filter out deleted images
      const transformedData = data.map(laag => ({
        ...laag,
        laagImages: Array.isArray(laag.laagImages) 
          ? laag.laagImages.filter((img: { is_deleted: boolean }) => !img.is_deleted)
          : []
      }))

      setLaags(transformedData)
    } catch (error) {
      console.error("Error fetching laags:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLaags()
  }, [groupId])

  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-3 w-[150px]" />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (laags.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed">
        <p className="text-muted-foreground">No laags yet. Be the first to create one!</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {laags.map((laag) => (
        <LaagCard key={laag.id} laag={laag} />
      ))}
    </div>
  )
} 