"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowDown, ArrowUp, Search, Trash2, Users } from "lucide-react"
import { useGroupPicture } from "@/hooks/useGroupPicture"
import { useAvatar } from "@/hooks/useAvatar"
import Image from "next/image"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
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

export interface Group {
  id: string
  group_name: string
  no_members: number
  created_at: string
  group_picture?: string | null
  owner: {
    id: string
    full_name: string
    avatar_url?: string | null
  }
  members?: {
    id: string
    group_member: string
    is_removed: boolean
  }[]
  is_deleted: boolean
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function GroupsTable({ groups, onDelete }: { groups: Group[]; onDelete: (id: string) => void }) {
  const router = useRouter()
  const [sortDirection, setSortDirection] = useState<"desc" | "asc">("desc")

  // Create a component for the group row to properly use hooks
  const GroupRow = ({ group }: { group: Group }) => {
    const groupPictureUrl = useGroupPicture(group.group_picture || null)
    const ownerAvatarUrl = useAvatar(group.owner?.avatar_url || null)

    return (
      <div className="grid grid-cols-5 gap-4 p-4 items-center hover:bg-muted/50 transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              {groupPictureUrl ? (
                <Image
                  src={groupPictureUrl || "/placeholder.svg"}
                  alt={group.group_name}
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "/default-group-picture.png"
                  }}
                />
              ) : (
                <Users className="h-4 w-4" />
              )}
            </div>
            <span className="font-medium truncate max-w-[200px]">{group.group_name}</span>
          </div>
        </div>
        <div>
          <Badge variant="secondary">{group.no_members} members</Badge>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={ownerAvatarUrl || undefined} />
              <AvatarFallback className="text-xs">{group.owner?.full_name?.charAt(0) || "?"}</AvatarFallback>
            </Avatar>
            <span className="text-sm truncate max-w-[150px]">{group.owner?.full_name || "Unknown"}</span>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">{formatDate(group.created_at)}</div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push(`/user/groups/${group.id}`)}>
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
                <AlertDialogTitle>Delete Group</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this group? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(group.id)}
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
        <div className="grid grid-cols-5 gap-4 font-medium text-sm">
          <div>Group Name</div>
          <div>Members</div>
          <div>Owner</div>
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
        {groups.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No groups found matching your criteria</div>
        ) : (
          groups.map((group) => <GroupRow key={group.id} group={group} />)
        )}
      </div>
    </div>
  )
}

export function AllGroupsTable() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(7)
  const [sortDirection, setSortDirection] = useState<"desc" | "asc">("desc")
  const [memberFilter, setMemberFilter] = useState<string>("all")
  const supabase = createClient()

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const { data, error } = await supabase
          .from("groups")
          .select(`
            id,
            group_name,
            no_members,
            created_at,
            group_picture,
            is_deleted,
            owner:profiles!owner(id, full_name, avatar_url),
            members:groupMembers(id, group_member, is_removed)
          `)
          .eq("is_deleted", false)

        if (error) throw error

        const transformedData = (data || []).map((group) => ({
          ...group,
          owner: Array.isArray(group.owner) ? group.owner[0] : group.owner,
          members: group.members || [],
        }))

        setGroups(transformedData)
      } catch (error) {
        console.error("Error fetching groups:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchGroups()
  }, [supabase])

  const handleDeleteGroup = async (groupId: string) => {
    try {
      const { error } = await supabase.from("groups").update({ is_deleted: true }).eq("id", groupId).select()

      if (error) {
        console.error("Error deleting group:", error)
        throw error
      }

      setGroups((prevGroups) => prevGroups.filter((group) => group.id !== groupId))
      toast.success("Group deleted successfully")
    } catch (error) {
      console.error("Error deleting group:", error)
      toast.error("Failed to delete group")
    }
  }

  // Filter groups based on search query and member count
  const filteredGroups = groups
    .filter((group) => {
      const matchesSearch = group.group_name.toLowerCase().includes(searchQuery.toLowerCase())

      if (memberFilter === "all") return matchesSearch
      if (memberFilter === "small") return matchesSearch && group.no_members <= 10
      if (memberFilter === "medium") return matchesSearch && group.no_members > 10 && group.no_members <= 50
      if (memberFilter === "large") return matchesSearch && group.no_members > 50

      return matchesSearch
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return sortDirection === "desc" ? dateB - dateA : dateA - dateB
    })

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-4">
          <div className="h-9 w-[250px] bg-muted rounded-md" />
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-5 w-10 bg-muted rounded" />
              <div className="h-8 w-[130px] bg-muted rounded" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-5 w-10 bg-muted rounded" />
              <div className="h-8 w-[70px] bg-muted rounded" />
              <div className="h-5 w-16 bg-muted rounded" />
            </div>
          </div>
        </div>

        <div className="rounded-md border">
          <div className="p-4 bg-muted/50">
            <div className="grid grid-cols-5 gap-4 font-medium text-sm">
              <div>Group Name</div>
              <div>Members</div>
              <div>Owner</div>
              <div>Created</div>
              <div className="text-right">Actions</div>
            </div>
          </div>
          <div className="divide-y">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="grid grid-cols-5 gap-4 p-4 items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-muted" />
                    <div className="h-5 w-32 bg-muted rounded" />
                  </div>
                </div>
                <div>
                  <div className="h-6 w-24 bg-muted rounded-full" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-muted" />
                    <div className="h-5 w-24 bg-muted rounded" />
                  </div>
                </div>
                <div className="h-5 w-24 bg-muted rounded" />
                <div className="flex justify-end gap-2">
                  <div className="h-8 w-16 bg-muted rounded" />
                  <div className="h-8 w-8 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-[250px]"
          />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Size:</span>
            <Select value={memberFilter} onValueChange={setMemberFilter}>
              <SelectTrigger className="h-8 w-[130px]">
                <SelectValue placeholder="All Sizes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sizes</SelectItem>
                <SelectItem value="small">Small (≤10)</SelectItem>
                <SelectItem value="medium">Medium (11-50)</SelectItem>
                <SelectItem value="large">Large (>50)</SelectItem>
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
                <SelectValue placeholder="7" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">per page</span>
          </div>
        </div>
      </div>

      <GroupsTable
        groups={filteredGroups.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)}
        onDelete={handleDeleteGroup}
      />

      {filteredGroups.length > 0 && (
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 px-4">
          <div className="text-sm text-muted-foreground">
            Showing {Math.min(filteredGroups.length, (currentPage - 1) * itemsPerPage + 1)} to{" "}
            {Math.min(filteredGroups.length, currentPage * itemsPerPage)} of {filteredGroups.length} groups
          </div>

          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>

              {Array.from({ length: Math.min(5, Math.ceil(filteredGroups.length / itemsPerPage)) }, (_, i) => {
                const pageNumber = i + 1
                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink onClick={() => setCurrentPage(pageNumber)} isActive={currentPage === pageNumber}>
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                )
              })}

              {Math.ceil(filteredGroups.length / itemsPerPage) > 5 && (
                <>
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink
                      onClick={() => setCurrentPage(Math.ceil(filteredGroups.length / itemsPerPage))}
                      isActive={currentPage === Math.ceil(filteredGroups.length / itemsPerPage)}
                    >
                      {Math.ceil(filteredGroups.length / itemsPerPage)}
                    </PaginationLink>
                  </PaginationItem>
                </>
              )}

              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setCurrentPage((p) => Math.min(Math.ceil(filteredGroups.length / itemsPerPage), p + 1))
                  }
                  className={
                    currentPage === Math.ceil(filteredGroups.length / itemsPerPage)
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}


export function GroupTable() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const supabase = createClient()
  const { user } = useAuth()

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const { data, error } = await supabase
          .from("groups")
          .select(`
            id,
            group_name,
            no_members,
            created_at,
            group_picture,
            is_deleted,
            owner:profiles!owner(id, full_name, avatar_url),
            members:groupMembers(id, group_member, is_removed)
          `)
          .eq("is_deleted", false)

        if (error) throw error

        // Transform the data to match our Group interface
        const transformedData = (data || []).map((group) => ({
          ...group,
          owner: Array.isArray(group.owner) ? group.owner[0] : group.owner,
          members: group.members || [],
        }))

        setGroups(transformedData)
      } catch (error) {
        console.error("Error fetching groups:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchGroups()
  }, [supabase])

  const handleDeleteGroup = async (groupId: string) => {
    try {
      const { error } = await supabase.from("groups").update({ is_deleted: true }).eq("id", groupId).select()

      if (error) {
        console.error("Error deleting group:", error)
        throw error
      }

      setGroups((prevGroups) => prevGroups.filter((group) => group.id !== groupId))
      toast.success("Group deleted successfully")
    } catch (error) {
      console.error("Error deleting group:", error)
      toast.error("Failed to delete group")
    }
  }

  // Filter groups based on search query
  const filteredGroups = groups.filter((group) => group.group_name.toLowerCase().includes(searchQuery.toLowerCase()))

  // Filter groups based on user's membership
  const userGroups = filteredGroups.filter(
    (group) => group.owner?.id === user?.id || group.members?.some((member) => member.group_member === user?.id),
  )
  const availableGroups = filteredGroups.filter(
    (group) => group.owner?.id !== user?.id && !group.members?.some((member) => member.group_member === user?.id),
  )

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4">
          <Skeleton className="h-9 w-[250px]" />
          <Skeleton className="h-5 w-[100px]" />
        </div>
        <div className="overflow-x-auto">
          <Table className="w-full min-w-[800px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[35%]">Group Name</TableHead>
                <TableHead className="w-[15%]">Members</TableHead>
                <TableHead className="w-[25%]">Owner</TableHead>
                <TableHead className="w-[15%]">Created</TableHead>
                <TableHead className="text-right w-[10%]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-6 w-[200px]" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-[80px]" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-6 w-6 rounded-full" />
                      <Skeleton className="h-6 w-[120px]" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-[120px]" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="ml-auto h-8 w-8" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Search Bar and New Group Button */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-[250px]"
          />
        </div>
        <NewGroupDialog />
      </div>

      {/* My Groups */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-4">
          <h2 className="text-lg font-semibold">My Groups</h2>
          <Badge variant="outline" className="text-xs">
            {userGroups.length} groups
          </Badge>
        </div>
        <div className="overflow-x-auto">
          <Table className="w-full min-w-[800px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[35%]">Group Name</TableHead>
                <TableHead className="w-[15%]">Members</TableHead>
                <TableHead className="w-[25%]">Owner</TableHead>
                <TableHead className="w-[15%]">Created</TableHead>
                <TableHead className="text-right w-[10%]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userGroups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    You are not a member of any groups.
                  </TableCell>
                </TableRow>
              ) : (
                userGroups.map((group) => <GroupRow key={group.id} group={group} onDelete={handleDeleteGroup} />)
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Available Groups */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-4">
          <h2 className="text-lg font-semibold">Available Groups</h2>
          <Badge variant="outline" className="text-xs">
            {availableGroups.length} groups
          </Badge>
        </div>
        <div className="overflow-x-auto">
          <Table className="w-full min-w-[800px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[35%]">Group Name</TableHead>
                <TableHead className="w-[15%]">Members</TableHead>
                <TableHead className="w-[25%]">Owner</TableHead>
                <TableHead className="w-[15%]">Created</TableHead>
                <TableHead className="text-right w-[10%]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {availableGroups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No available groups found.
                  </TableCell>
                </TableRow>
              ) : (
                availableGroups.map((group) => <GroupRow key={group.id} group={group} onDelete={handleDeleteGroup} />)
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* All Groups */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-4">
          <h2 className="text-lg font-semibold">All Groups</h2>
          <Badge variant="outline" className="text-xs">
            {filteredGroups.length} groups
          </Badge>
        </div>
        <div className="overflow-x-auto">
          <Table className="w-full min-w-[800px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[35%]">Group Name</TableHead>
                <TableHead className="w-[15%]">Members</TableHead>
                <TableHead className="w-[25%]">Owner</TableHead>
                <TableHead className="w-[15%]">Created</TableHead>
                <TableHead className="text-right w-[10%]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGroups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No groups found matching your search.
                  </TableCell>
                </TableRow>
              ) : (
                filteredGroups.map((group) => <GroupRow key={group.id} group={group} onDelete={handleDeleteGroup} />)
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
