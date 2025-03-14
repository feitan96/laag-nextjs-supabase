"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Group } from "@/app/user/groups/group-table"

interface EditGroupModalProps {
  group: Group
  isOpen: boolean
  onClose: () => void
  onSave: (groupId: string, newName: string) => void
}

export function EditGroupModal({ group, isOpen, onClose, onSave }: EditGroupModalProps) {
  const [groupName, setGroupName] = useState(group.group_name)

  const handleSave = () => {
    if (!groupName.trim()) {
      toast.error("Group name cannot be empty")
      return
    }
    onSave(group.id, groupName)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Group</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Enter group name"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}