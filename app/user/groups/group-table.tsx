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
import { EmptyState } from "./empty-state"

interface Group {
  group_name: string
  id?: string
  member_count?: number
  created_at?: string
}

export function GroupTable() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const supabase = createClient()

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const { data, error } = await supabase.from("groups").select("*")

        if (error) {
          throw error
        }

        // Transform data to include member count (in a real app, you might get this from the DB)
        const groupsWithMeta =
          data?.map((group) => ({
            ...group,
            member_count: Math.floor(Math.random() * 20) + 1, // Simulated member count
          })) || []

        setGroups(groupsWithMeta)
      } catch (error) {
        console.error("Error fetching groups:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchGroups()
  }, [supabase])

  // Filter groups based on search query
  const filteredGroups = groups.filter((group) => group.group_name.toLowerCase().includes(searchQuery.toLowerCase()))

  // Function to format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

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
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Group Name</TableHead>
            <TableHead>Members</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredGroups.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">
                No groups found matching your search.
              </TableCell>
            </TableRow>
          ) : (
            filteredGroups.map((group, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Users className="h-4 w-4" />
                    </div>
                    {group.group_name}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{group.member_count || 0} members</Badge>
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
                      <DropdownMenuItem>Edit group</DropdownMenuItem>
                      <DropdownMenuItem>Manage members</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">Delete group</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
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

