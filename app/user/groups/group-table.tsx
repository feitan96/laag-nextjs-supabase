// components/group-table.tsx
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
import { MoreHorizontal, Plus, Search, Users } from "lucide-react"
import { EmptyState } from "./empty-state"
import { useGroupPicture } from "@/hooks/useGroupPicture"
import Image from "next/image"
import { toast } from "sonner"
import { useAuth } from "@/app/context/auth-context"
import { NewGroupForm } from "@/components/new-group-form"
import { EditGroupModal } from "@/components/edit-group-modal"

export interface Group {
  id: string
  group_name: string
  no_members: number
  created_at: string
  group_picture?: string | null
  owner?: {
    id: string
    full_name: string
  }
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

  const supabase = createClient()

  const handleEditGroup = async (groupId: string, newName: string) => {
    try {
      console.log("Attempting to update group with ID:", groupId)
      console.log("New group name:", newName)

      const { data, error } = await supabase
        .from("groups")
        .update({ group_name: newName })
        .eq("id", groupId)
        .select()

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
                  src={groupPictureUrl}
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
          {group.owner?.full_name || "Unknown"}
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
              <DropdownMenuItem>View details</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsEditModalOpen(true)}>
                Edit group
              </DropdownMenuItem>
              <DropdownMenuItem>Manage members</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete(group.id)}
              >
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
  const [showForm, setShowForm] = useState(false)
  const [users, setUsers] = useState<{ id: string; full_name: string }[]>([])
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
            owner:profiles!owner(id, full_name)
          `)
          .eq("is_deleted", false) // Filter out deleted groups

        if (error) throw error
        setGroups(data || [])
      } catch (error) {
        console.error("Error fetching groups:", error)
      } finally {
        setLoading(false)
      }
    }

    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, full_name")
          .neq("id", user?.id || "") // Exclude the signed-in user

        if (error) throw error
        setUsers(data || [])
      } catch (error) {
        console.error("Error fetching users:", error)
      }
    }

    fetchGroups()
    fetchUsers()
  }, [supabase, user])

  const handleDeleteGroup = async (groupId: string) => {
    try {
      console.log("Attempting to delete group with ID:", groupId);
  
      // Log the current user (for debugging RLS policies)
      console.log("Current user ID:", user?.id);
  
      // Log the group data before the update
      const groupToDelete = groups.find((group) => group.id === groupId);
      console.log("Group to delete:", groupToDelete);
  
      // Update the group's `is_deleted` field
      const { data, error } = await supabase
        .from("groups")
        .update({ is_deleted: true })
        .eq("id", groupId)
        .select(); // Include this to return the updated row
  
      if (error) {
        console.error("Error deleting group:", error);
        throw error;
      }
  
      // Log the updated group data
      console.log("Group soft-deleted successfully. Updated data:", data);
  
      // Remove the deleted group from the local state
      setGroups((prevGroups) => prevGroups.filter((group) => group.id !== groupId));
      toast.success("Group deleted successfully");
    } catch (error) {
      console.error("Error deleting group:", error);
      toast.error("Failed to delete group");
    }
  };

  const filteredGroups = groups.filter((group) =>
    group.group_name.toLowerCase().includes(searchQuery.toLowerCase())
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
                  <Skeleton className="h-6 w-[120px]" />
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

  if (groups.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="space-y-4">
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
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {filteredGroups.length} groups
          </Badge>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-2 h-4 w-4" />
            New Group
          </Button>
        </div>
      </div>

      {showForm && (
        <NewGroupForm
          users={users}
          onSuccess={() => {
            setShowForm(false)
            // Optionally refetch groups here
          }}
        />
      )}

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
            filteredGroups.map((group) => (
              <GroupRow
                key={group.id}
                group={group}
                onDelete={handleDeleteGroup}
              />
            ))
          )}
        </TableBody>
      </Table>

      {filteredGroups.length > 0 && (
        <div className="flex items-center justify-end space-x-2 p-4">
          <div className="text-sm text-muted-foreground">
            Showing <span className="font-medium">{filteredGroups.length}</span> of{" "}
            <span className="font-medium">{groups.length}</span> groups
          </div>
        </div>
      )}
    </div>
  )
}