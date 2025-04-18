"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Users } from "lucide-react"
import { GroupMembersCard } from "./group-members-card"
import { useState } from "react"

interface MobileGroupMembersProps {
  owner: any
  members: any[]
  totalMembers: number
}

export function MobileGroupMembers({ owner, members, totalMembers }: MobileGroupMembersProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button 
        variant="outline" 
        className="md:hidden fixed bottom-4 right-4 z-50 rounded-full h-12 w-12 p-0"
        onClick={() => setOpen(true)}
      >
        <Users className="h-5 w-5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="h-[80vh] p-0">
          <DialogHeader className="px-4 pt-6 pb-4">
            <DialogTitle>Group Members</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto px-2">
            <GroupMembersCard
              owner={owner}
              members={members}
              totalMembers={totalMembers}
              className="border-0 shadow-none"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}