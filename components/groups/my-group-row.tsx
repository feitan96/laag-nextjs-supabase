"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useGroupPicture } from "@/hooks/useGroupPicture"
import Image from "next/image"
import { Users } from "lucide-react"
import type { Group } from "./my-groups-card"

interface MyGroupRowProps {
  group: Group
}

export function MyGroupRow({ group }: MyGroupRowProps) {
  const router = useRouter()
  const groupPictureUrl = useGroupPicture(group.group_picture || null)

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          {groupPictureUrl ? (
            <Image
              src={groupPictureUrl || "/placeholder.svg"}
              alt={group.group_name}
              width={40}
              height={40}
              className="h-10 w-10 rounded-full object-cover"
              onError={(e) => {
                e.currentTarget.src = "/default-group-picture.png"
              }}
            />
          ) : (
            <Users className="h-5 w-5" />
          )}
        </div>
        <h3 className="font-medium">{group.group_name}</h3>
      </div>
      <Button variant="outline" size="sm" onClick={() => router.push(`/user/groups/${group.id}`)}>
        View
      </Button>
    </div>
  )
}
