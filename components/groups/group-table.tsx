"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowDown, ArrowUp, MoreHorizontal, Search, Users } from "lucide-react"
import { useGroupPicture } from "@/hooks/useGroupPicture"
import { useAvatar } from "@/hooks/useAvatar"
import Image from "next/image"
import { toast } from "sonner"
import { useAuth } from "@/app/context/auth-context"
import { NewGroupDialog } from "@/components/groups/create-group-dialog"
import { EditGroupModal } from "@/components/groups/edit-group-dialog"
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

function GroupRow({ group, onDelete }: { group: Group; onDelete: (groupId: string) => void }) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const groupPictureUrl = useGroupPicture(group.group_picture || null)
  const ownerAvatarUrl = useAvatar(group.owner?.avatar_url || null)
  const router = useRouter()

  const supabase = createClient()

  const handleEditGroup = async (groupId: string, newName: string) => {
    try {
      console.log("Attempting to update group with ID:", groupId)
      console.log("New group name:", newName)

      const { data, error } = await supabase.from("groups").update({ group_name: newName }).eq("id", groupId).select()

      if (error) {
        console.error("Error updating group:", error)
        throw error
      }

      console.log("Group updated successfully. Updated data:", data)
      toast.success("Group updated successfully")
    } catch (error) {
      console.error("Error updating group:", error)
      toast.error("Failed to update group")
    }
  }

  return (
    <>
      <TableRow key={group.id} className="hover:bg-muted/50 transition-colors">
        <TableCell className="font-medium w-[35%]">
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
            <span className="truncate max-w-[200px]">{group.group_name}</span>
          </div>
        </TableCell>
        <TableCell className="w-[15%]">
          <Badge variant="secondary">{group.no_members} members</Badge>
        </TableCell>
        <TableCell className="w-[25%]">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={ownerAvatarUrl || undefined} />
              <AvatarFallback className="text-xs">{group.owner?.full_name?.charAt(0) || "?"}</AvatarFallback>
            </Avatar>
            <span className="truncate max-w-[150px]">{group.owner?.full_name || "Unknown"}</span>
          </div>
        </TableCell>
        <TableCell className="w-[15%]">{formatDate(group.created_at)}</TableCell>
        <TableCell className="text-right w-[10%]">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push(`/user/groups/${group.id}`)}>View group</DropdownMenuItem>
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                    Delete group
                  </DropdownMenuItem>
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
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>

      <EditGroupModal
        group={group}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleEditGroup}
      />
    </>
  )
}

export function AllGroupsTable() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
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

  const paginatedGroups = filteredGroups.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

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
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-4 w-full">
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
            <span className="text-sm text-muted-foreground">Show:</span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => {
                setItemsPerPage(Number.parseInt(value))
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder="10" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">per page</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table className="w-full min-w-[800px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[35%]">Group Name</TableHead>
              <TableHead className="w-[15%]">Members</TableHead>
              <TableHead className="w-[25%]">Owner</TableHead>
              <TableHead
                className="w-[15%] cursor-pointer"
                onClick={() => setSortDirection(sortDirection === "desc" ? "asc" : "desc")}
              >
                <div className="flex items-center gap-1">
                  Created
                  {sortDirection === "desc" ? (
                    <ArrowDown className="h-3 w-3 ml-1" />
                  ) : (
                    <ArrowUp className="h-3 w-3 ml-1" />
                  )}
                </div>
              </TableHead>
              <TableHead className="text-right w-[10%]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedGroups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No groups found matching your search.
                </TableCell>
              </TableRow>
            ) : (
              paginatedGroups.map((group) => <GroupRow key={group.id} group={group} onDelete={handleDeleteGroup} />)
            )}
          </TableBody>
        </Table>
      </div>

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
