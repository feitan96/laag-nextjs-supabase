"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { MyGroupRow } from "./my-group-row"

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

  return (
    <Card className="overflow-hidden sticky top-6">
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold">My Groups</h2>
        <p className="text-sm text-muted-foreground">Groups you&apos;re a member of</p>
      </div>
      <div className="p-4">
        {userGroups.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground">You are not a member of any groups.</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push("/user/groups")}>
              Browse Groups
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {userGroups.map((group) => (
              <MyGroupRow key={group.id} group={group} />
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}
