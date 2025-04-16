"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { MyGroupRow } from "./my-group-row"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Users } from "lucide-react"
import { useState } from "react"
import { NewGroupDialog } from "./create-group-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useGroupPicture } from "@/hooks/useGroupPicture"
import { useAvatar } from "@/hooks/useAvatar"
import Image from "next/image"

// Define the Group interface
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

interface MyGroupsCardProps {
  userGroups: Group[]
}

// Add this new component at the top level
function GroupItem({ group }: { group: Group }) {
  const router = useRouter()
  const groupPictureUrl = useGroupPicture(group.group_picture)

  return (
    <div
      key={group.id}
      className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50"
      onClick={() => router.push(`/user/groups/${group.id}`)}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
        {group.group_picture ? (
          <Image
            src={groupPictureUrl || "/placeholder.svg"}
            alt={group.group_name}
            width={40}
            height={40}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <Users className="h-5 w-5 text-primary" />
        )}
      </div>
      <div className="flex-1">
        <p className="font-medium">{group.group_name}</p>
        <p className="text-xs text-muted-foreground">
          {group.no_members} member{group.no_members !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  )
}

export function GroupsCard({ userGroups }: MyGroupsCardProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [displayCount, setDisplayCount] = useState(5)

  // Filter groups based on search query
  const filteredGroups = userGroups.filter(group => 
    group.group_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Get visible groups based on display count
  const visibleGroups = filteredGroups.slice(0, displayCount)
  const hasMoreGroups = filteredGroups.length > displayCount

  const handleShowMore = () => {
    setDisplayCount(prev => prev + 5)
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>My Groups</span>
          <Badge variant="secondary">{userGroups.length} total</Badge>
        </CardTitle>
        <CardDescription>Groups you&apos;re a member of</CardDescription>
        <div className="relative mt-2">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search groups..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4 custom-scrollbar">
          <div className="space-y-6">
            {userGroups.length === 0 ? (
              <div className="text-center py-6">
                <div className="flex justify-center mb-4">
                  <Users className="h-12 w-12 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-4">You are not a member of any groups.</p>
                <NewGroupDialog />
              </div>
            ) : (
              <>
                <div className="flex justify-end">
                  <NewGroupDialog />
                </div>
                <div className="space-y-3">
                  {visibleGroups.map((group) => (
                    <GroupItem key={group.id} group={group} />
                  ))}
                </div>
                {hasMoreGroups && (
                  <Button
                    variant="ghost"
                    className="w-full text-sm text-muted-foreground hover:text-foreground"
                    onClick={handleShowMore}
                  >
                    Show more groups
                  </Button>
                )}
                {searchQuery && filteredGroups.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-4">
                    No groups found matching &quot;{searchQuery}&quot;
                  </p>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
