"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Search, User2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAvatar } from "@/hooks/useAvatar"

interface GroupMember {
  id: string
  group_member: string
  is_removed: boolean
  profile: {
    id: string
    full_name: string
    avatar_url?: string | null
  }
}

interface GroupOwner {
  id: string
  full_name: string
  avatar_url?: string | null
}

interface GroupMembersCardProps {
  owner: GroupOwner
  members: GroupMember[]
  totalMembers: number
  className?: string  // Add className prop for adjustable width
}

function MemberAvatar({ avatarUrl, fullName }: { avatarUrl: string | null, fullName: string }) {
  const memberAvatarUrl = useAvatar(avatarUrl)
  return (
    <Avatar>
      <AvatarImage src={memberAvatarUrl || undefined} />
      <AvatarFallback>{fullName.charAt(0)}</AvatarFallback>
    </Avatar>
  )
}

export function GroupMembersCard({ owner, members, totalMembers, className }: GroupMembersCardProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [displayCount, setDisplayCount] = useState(5)

  // Filter members based on search query and exclude owner
  const filteredMembers = members.filter(member => 
    member.profile.id !== owner.id && // Exclude owner
    member.profile.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Get visible members based on display count
  const visibleMembers = filteredMembers.slice(0, displayCount)
  const hasMoreMembers = filteredMembers.length > displayCount

  const handleShowMore = () => {
    setDisplayCount(prev => prev + 5)
  }

  return (
    <Card className={`overflow-hidden w-full max-w-md ${className}`}>
      <CardHeader className="px-4">
        <CardTitle className="flex items-center justify-between">
          <span>Members</span>
          <Badge variant="secondary">{totalMembers} total</Badge>
        </CardTitle>
        <CardDescription>People who are part of this group</CardDescription>
        <div className="relative mt-2">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent className="px-4">
        <ScrollArea className="h-[400px] pr-4 custom-scrollbar">
          <div className="space-y-6">
            {/* Owner Section - Always visible */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Owner</h3>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <MemberAvatar avatarUrl={owner.avatar_url || null} fullName={owner.full_name} />
                <div>
                  <p className="font-medium">{owner.full_name}</p>
                  <p className="text-xs text-muted-foreground">Group Owner</p>
                </div>
              </div>
            </div>

            {/* Members Section */}
            {members.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">Members</h3>
                <div className="grid gap-3">
                  {visibleMembers.map((member) => (
                    <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg border">
                      <MemberAvatar
                        avatarUrl={member.profile.avatar_url || null}
                        fullName={member.profile.full_name}
                      />
                      <div>
                        <p className="font-medium">{member.profile.full_name}</p>
                        <p className="text-xs text-muted-foreground">Member</p>
                      </div>
                    </div>
                  ))}
                </div>
                {hasMoreMembers && (
                  <Button
                    variant="ghost"
                    className="w-full text-sm text-muted-foreground hover:text-foreground"
                    onClick={handleShowMore}
                  >
                    Show more members
                  </Button>
                )}
                {searchQuery && filteredMembers.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-4">
                    No members found matching &quot;{searchQuery}&quot;
                  </p>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}