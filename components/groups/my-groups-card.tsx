"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { MyGroupRow } from "./my-group-row"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useState } from "react"

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
    <Card className="overflow-hidden sticky top-6">
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold">My Groups</h2>
        <p className="text-sm text-muted-foreground">Groups you&apos;re a member of</p>
      </div>
      
      {userGroups.length > 0 && (
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search groups..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      )}

      <ScrollArea className="h-[400px]">
        <div className="p-4">
          {userGroups.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground">You are not a member of any groups.</p>
              <Button 
                variant="outline" 
                className="mt-4" 
                onClick={() => router.push("/user/groups")}
              >
                Browse Groups
              </Button>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground">No groups match your search.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {visibleGroups.map((group) => (
                <MyGroupRow key={group.id} group={group} />
              ))}
              {hasMoreGroups && (
                <Button
                  variant="ghost"
                  className="w-full text-sm text-muted-foreground hover:text-foreground"
                  onClick={handleShowMore}
                >
                  Show more groups
                </Button>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  )
}
