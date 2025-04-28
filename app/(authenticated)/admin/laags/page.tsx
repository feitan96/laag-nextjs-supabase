"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, Trash2, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAvatar } from "@/hooks/useAvatar"
import { format } from "date-fns"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { getStatusVariant } from "@/services/laags"
import type { Laag } from "@/types"
import { useGroupPicture } from "@/hooks/useGroupPicture"
import Image from "next/image"

function LaagsTable({ laags, onDelete }: { laags: Laag[], onDelete: (id: string) => void }) {
  const router = useRouter()

  // Create a component for the laag row to properly use hooks
  const LaagRow = ({ laag }: { laag: Laag }) => {
    const organizerAvatarUrl = useAvatar(laag.organizer.avatar_url || null)
    const groupPictureUrl = useGroupPicture(laag.group?.group_picture || null)

    return (
      <div className="grid grid-cols-7 gap-4 p-4 items-center">
        <div className="col-span-2">
          <h3 className="font-medium">{laag.what}</h3>
          <p className="text-sm text-muted-foreground">{laag.where}</p>
        </div>
        <div>
          <Badge variant={getStatusVariant(laag.status)}>{laag.status}</Badge>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
              {groupPictureUrl ? (
                <Image
                  src={groupPictureUrl}
                  alt={laag.group?.group_name || "Group"}
                  width={24}
                  height={24}
                  className="h-6 w-6 rounded-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "/default-group-picture.png"
                  }}
                />
              ) : (
                <Users className="h-3 w-3 text-primary" />
              )}
            </div>
            <span className="text-sm">{laag.group?.group_name}</span>
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={organizerAvatarUrl || undefined} />
              <AvatarFallback>{laag.organizer.full_name.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="text-sm">{laag.organizer.full_name}</span>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          {format(new Date(laag.created_at), "MMM d, yyyy")}
        </div>
        <div className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push(`/user/groups/${laag.group_id}/laags/${laag.id}?from=group`)}
          >
            View
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4" />
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
                <AlertDialogAction 
                  onClick={() => onDelete(laag.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <div className="p-4">
        <div className="grid grid-cols-7 gap-4 font-medium">
          <div className="col-span-2">Details</div>
          <div>Status</div>
          <div>Group</div>
          <div>Organizer</div>
          <div>Created</div>
          <div className="text-right">Actions</div>
        </div>
      </div>
      <div className="divide-y">
        {laags.map((laag) => (
          <LaagRow key={laag.id} laag={laag} />
        ))}
      </div>
    </div>
  )
}

export default function LaagManagement() {
  const [laags, setLaags] = useState<Laag[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const supabase = createClient()

  const fetchLaags = async () => {
    try {
      const { data, error } = await supabase
        .from("laags")
        .select(`
          *,
          organizer:profiles!organizer(id, full_name, avatar_url),
          group:groups!group_id(id, group_name, group_picture),
          laagImages(*),
          laagAttendees(*),
          comments(*)
        `)
        .eq('is_deleted', false)
        .order("created_at", { ascending: false })

      if (error) throw error
      setLaags(data || [])
    } catch (error) {
      console.error("Error fetching laags:", error)
      toast.error("Failed to fetch laags")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLaags()
  }, [])

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("laags")
        .update({ is_deleted: true })
        .eq("id", id)

      if (error) throw error

      toast.success("Laag deleted successfully")
      fetchLaags()
    } catch (error) {
      console.error("Error deleting laag:", error)
      toast.error("Failed to delete laag")
    }
  }

  const filteredLaags = laags.filter(laag => 
    laag.what.toLowerCase().includes(searchQuery.toLowerCase()) ||
    laag.where.toLowerCase().includes(searchQuery.toLowerCase()) ||
    laag.organizer.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="container py-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Laag Management</h1>
          </div>
          <div className="h-[400px] flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Laag Management</h1>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search laags..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Laags</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredLaags.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                No laags found
              </div>
            ) : (
              <LaagsTable laags={filteredLaags} onDelete={handleDelete} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}