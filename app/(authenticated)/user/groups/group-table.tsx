"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { MoreHorizontal, Search, Users } from "lucide-react"
import { useGroupPicture } from "@/hooks/useGroupPicture"
import { useAvatar } from "@/hooks/useAvatar"
import Image from "next/image"
import { toast } from "sonner"
import { useAuth } from "@/app/context/auth-context"
import { NewGroupDialog } from "@/app/(authenticated)/user/groups/new-group-dialog"
import { EditGroupModal } from "@/components/edit-group-modal"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"

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
      <TableRow key={group.id}>
        <TableCell className="font-medium">
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
            {group.group_name}
          </div>
        </TableCell>
        <TableCell>
          <Badge variant="secondary">{group.no_members} members</Badge>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={ownerAvatarUrl || undefined} />
              <AvatarFallback className="text-xs">{group.owner?.full_name?.charAt(0) || "?"}</AvatarFallback>
            </Avatar>
            <span>{group.owner?.full_name || "Unknown"}</span>
          </div>
        </TableCell>
        <TableCell>{formatDate(group.created_at)}</TableCell>
        <TableCell className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push(`/user/groups/${group.id}`)}>
                View group
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsEditModalOpen(true)}>Edit group</DropdownMenuItem>
              <DropdownMenuItem>Manage members</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => onDelete(group.id)}>
                Delete group
              </DropdownMenuItem>
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

export function GroupTable() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const supabase = createClient()
  const { user } = useAuth()
  const router = useRouter()

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
          members: group.members || []
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
    (group) => group.owner?.id === user?.id || group.members?.some((member) => member.group_member === user?.id)
  )
  const availableGroups = filteredGroups.filter(
    (group) => group.owner?.id !== user?.id && !group.members?.some((member) => member.group_member === user?.id)
  )

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4">
          <Skeleton className="h-9 w-[250px]" />
          <Skeleton className="h-5 w-[100px]" />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Group Name</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Group Name</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
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

      {/* Available Groups */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-4">
          <h2 className="text-lg font-semibold">Available Groups</h2>
          <Badge variant="outline" className="text-xs">
            {availableGroups.length} groups
          </Badge>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Group Name</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
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

      {/* All Groups */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-4">
          <h2 className="text-lg font-semibold">All Groups</h2>
          <Badge variant="outline" className="text-xs">
            {filteredGroups.length} groups
          </Badge>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Group Name</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
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
  )
}

