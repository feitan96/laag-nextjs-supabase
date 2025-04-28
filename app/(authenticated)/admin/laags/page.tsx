"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, Trash2, Users, ArrowUp, ArrowDown } from "lucide-react"
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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

function LaagsTable({ laags, onDelete }: { laags: Laag[]; onDelete: (id: string) => void }) {
  const router = useRouter()
  const [sortDirection, setSortDirection] = useState<"desc" | "asc">("desc")

  // Create a component for the laag row to properly use hooks
  const LaagRow = ({ laag }: { laag: Laag }) => {
    const organizerAvatarUrl = useAvatar(laag.organizer.avatar_url || null)
    const groupPictureUrl = useGroupPicture(laag.group?.group_picture || null)

    return (
      <div className="grid grid-cols-7 gap-4 p-4 items-center hover:bg-muted/50 transition-colors">
        <div className="col-span-2">
          <h3 className="font-medium truncate">{laag.what}</h3>
          <p className="text-sm text-muted-foreground truncate">{laag.where}</p>
        </div>
        <div>
          <Badge variant={getStatusVariant(laag.status)}>{laag.status}</Badge>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
              {groupPictureUrl ? (
                <Image
                  src={groupPictureUrl || "/placeholder.svg"}
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
            <span className="text-sm truncate">{laag.group?.group_name}</span>
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={organizerAvatarUrl || undefined} />
              <AvatarFallback>{laag.organizer.full_name.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="text-sm truncate">{laag.organizer.full_name}</span>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">{format(new Date(laag.created_at), "MMM d, yyyy")}</div>
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
      <div className="p-4 bg-muted/50">
        <div className="grid grid-cols-7 gap-4 font-medium text-sm">
          <div className="col-span-2">Details</div>
          <div>Status</div>
          <div>Group</div>
          <div>Organizer</div>
          <div
            className="flex items-center gap-1 cursor-pointer"
            onClick={() => setSortDirection(sortDirection === "desc" ? "asc" : "desc")}
          >
            Created
            {sortDirection === "desc" ? <ArrowDown className="h-3 w-3 ml-1" /> : <ArrowUp className="h-3 w-3 ml-1" />}
          </div>
          <div className="text-right">Actions</div>
        </div>
      </div>
      <div className="divide-y">
        {laags.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No laags found matching your criteria</div>
        ) : (
          laags.map((laag) => <LaagRow key={laag.id} laag={laag} />)
        )}
      </div>
    </div>
  )
}

export default function LaagManagement() {
  const [laags, setLaags] = useState<Laag[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const supabase = createClient()
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(8)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortDirection, setSortDirection] = useState<"desc" | "asc">("desc")

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
        .eq("is_deleted", false)
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
      const { error } = await supabase.from("laags").update({ is_deleted: true }).eq("id", id)

      if (error) throw error

      toast.success("Laag deleted successfully")
      fetchLaags()
    } catch (error) {
      console.error("Error deleting laag:", error)
      toast.error("Failed to delete laag")
    }
  }

  const filteredLaags = laags
    .filter(
      (laag) =>
        (statusFilter === "all" || laag.status === statusFilter) &&
        (laag.what.toLowerCase().includes(searchQuery.toLowerCase()) ||
          laag.where.toLowerCase().includes(searchQuery.toLowerCase()) ||
          laag.organizer.full_name.toLowerCase().includes(searchQuery.toLowerCase())),
    )
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return sortDirection === "desc" ? dateB - dateA : dateA - dateB
    })

  if (loading) {
    return (
      <div className="container pt-0 pb-0">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Laag Management</h1>
            <div className="relative w-64 h-10 bg-muted rounded-md" />
          </div>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="h-6 w-24 bg-muted rounded" />
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-14 bg-muted rounded" />
                    <div className="h-8 w-[130px] bg-muted rounded" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-10 bg-muted rounded" />
                    <div className="h-8 w-[70px] bg-muted rounded" />
                    <div className="h-5 w-16 bg-muted rounded" />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="p-4 bg-muted/50">
                  <div className="grid grid-cols-7 gap-4 font-medium text-sm">
                    <div className="col-span-2">Details</div>
                    <div>Status</div>
                    <div>Group</div>
                    <div>Organizer</div>
                    <div>Created</div>
                    <div className="text-right">Actions</div>
                  </div>
                </div>
                <div className="divide-y">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="grid grid-cols-7 gap-4 p-4 items-center">
                      <div className="col-span-2">
                        <div className="h-5 w-40 bg-muted rounded mb-1" />
                        <div className="h-4 w-32 bg-muted rounded" />
                      </div>
                      <div>
                        <div className="h-6 w-20 bg-muted rounded-full" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-muted" />
                          <div className="h-4 w-20 bg-muted rounded" />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-muted" />
                          <div className="h-4 w-20 bg-muted rounded" />
                        </div>
                      </div>
                      <div className="h-4 w-24 bg-muted rounded" />
                      <div className="flex justify-end gap-2">
                        <div className="h-8 w-16 bg-muted rounded" />
                        <div className="h-8 w-8 bg-muted rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container pt-4 pb-6">
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
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>All Laags</CardTitle>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-8 w-[130px]">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="Planning">Planning</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Show</span>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => {
                      setItemsPerPage(Number.parseInt(value))
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger className="h-8 w-[70px]">
                      <SelectValue placeholder="8" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="8">8</SelectItem>
                      <SelectItem value="15">15</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground">per page</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredLaags.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">No laags found</div>
            ) : (
              <>
                <LaagsTable
                  laags={filteredLaags.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)}
                  onDelete={handleDelete}
                />

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {Math.min(filteredLaags.length, (currentPage - 1) * itemsPerPage + 1)} to{" "}
                    {Math.min(filteredLaags.length, currentPage * itemsPerPage)} of {filteredLaags.length} laags
                  </div>

                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>

                      {Array.from({ length: Math.min(5, Math.ceil(filteredLaags.length / itemsPerPage)) }, (_, i) => {
                        const pageNumber = i + 1
                        return (
                          <PaginationItem key={pageNumber}>
                            <PaginationLink
                              onClick={() => setCurrentPage(pageNumber)}
                              isActive={currentPage === pageNumber}
                            >
                              {pageNumber}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      })}

                      {Math.ceil(filteredLaags.length / itemsPerPage) > 5 && (
                        <>
                          <PaginationItem>
                            <PaginationEllipsis />
                          </PaginationItem>
                          <PaginationItem>
                            <PaginationLink
                              onClick={() => setCurrentPage(Math.ceil(filteredLaags.length / itemsPerPage))}
                              isActive={currentPage === Math.ceil(filteredLaags.length / itemsPerPage)}
                            >
                              {Math.ceil(filteredLaags.length / itemsPerPage)}
                            </PaginationLink>
                          </PaginationItem>
                        </>
                      )}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            setCurrentPage((p) => Math.min(Math.ceil(filteredLaags.length / itemsPerPage), p + 1))
                          }
                          className={
                            currentPage === Math.ceil(filteredLaags.length / itemsPerPage)
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
