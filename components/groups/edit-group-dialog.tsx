"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/utils/supabase/client"
import { toast } from "sonner"
import Image from "next/image"
import { useGroupPicture } from "@/hooks/useGroupPicture"
import { Users } from "lucide-react"
import type { Group } from "@/components/groups/group-table"

interface EditGroupModalProps {
  group: Group
  isOpen: boolean
  onClose: () => void
  onSave: (groupId: string, newName: string) => Promise<void>
}

export function EditGroupModal({ group, isOpen, onClose, onSave }: EditGroupModalProps) {
  const [groupName, setGroupName] = useState(group.group_name)
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()
  const groupPictureUrl = useGroupPicture(group.group_picture || null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      // Update group name
      await onSave(group.id, groupName)

      // Update group picture if a new one was uploaded
      if (uploadedImage) {
        // Upload the new image
        const fileExt = uploadedImage.name.split('.').pop()
        const filePath = `${group.id}-${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('group')
          .upload(filePath, uploadedImage)

        if (uploadError) throw uploadError

        // Update the group with the new image path
        const { error: updateError } = await supabase
          .from('groups')
          .update({ group_picture: filePath })
          .eq('id', group.id)

        if (updateError) throw updateError
      }

      toast.success("Group updated successfully")
      onClose()
      window.location.reload()
    } catch (error) {
      console.error("Error saving group:", error)
      toast.error("Failed to update group")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Group</DialogTitle>
          <DialogDescription>Make changes to your group here. Click save when you&apos;re done.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="group-name" className="text-right">
              Name
            </Label>
            <Input
              id="group-name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="group-picture" className="text-right">
              Picture
            </Label>
            <div className="col-span-3 space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                {imagePreview ? (
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    width={64}
                    height={64}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : groupPictureUrl ? (
                  <Image
                    src={groupPictureUrl}
                    alt={group.group_name}
                    width={64}
                    height={64}
                    className="h-16 w-16 rounded-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/default-group-picture.png"
                    }}
                  />
                ) : (
                  <Users className="h-8 w-8" />
                )}
              </div>
              <Input
                id="group-picture"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="cursor-pointer"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={isLoading || !groupName.trim()}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

