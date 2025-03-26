"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAvatar } from "@/hooks/useAvatar"
import { toast } from "sonner"

interface Profile {
  id: string
  full_name: string
  avatar_url: string | null
}

interface GroupMember {
  id: string
  group_member: string
  is_removed: boolean
  profile: Profile
}

interface ManageMembersDialogProps {
  groupId: string
  isOpen: boolean
  onClose: () => void
  onMembersUpdated: () => void
  ownerId: string
}

function MemberAvatar({ avatarUrl, fullName }: { avatarUrl: string | null; fullName: string }) {
  const memberAvatarUrl = useAvatar(avatarUrl)
  return (
    <Avatar>
      <AvatarImage src={memberAvatarUrl || undefined} />
      <AvatarFallback>{fullName.charAt(0)}</AvatarFallback>
    </Avatar>
  )
}

export function ManageMembersDialog({ groupId, isOpen, onClose, onMembersUpdated, ownerId }: ManageMembersDialogProps) {
  const [currentMembers, setCurrentMembers] = useState<GroupMember[]>([])
  const [availableProfiles, setAvailableProfiles] = useState<Profile[]>([])
  const [owner, setOwner] = useState<Profile | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (isOpen) {
      fetchCurrentMembers()
      fetchAvailableProfiles()
      fetchOwner()
    }
  }, [isOpen, groupId])

  const fetchOwner = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .eq("id", ownerId)
        .single()

      if (error) throw error
      setOwner(data)
    } catch (error) {
      console.error("Error fetching owner:", error)
      toast.error("Failed to fetch owner information")
    }
  }

  const fetchCurrentMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("groupMembers")
        .select(`
          id,
          group_member,
          is_removed,
          profile:profiles(id, full_name, avatar_url)
        `)
        .eq("group_id", groupId)
        .eq("is_removed", false)

      if (error) throw error

      const transformedData = (data || []).map(member => ({
        ...member,
        profile: Array.isArray(member.profile) ? member.profile[0] : member.profile
      }))

      setCurrentMembers(transformedData)
    } catch (error) {
      console.error("Error fetching current members:", error)
      toast.error("Failed to fetch current members")
    }
  }

  const fetchAvailableProfiles = async () => {
    try {
      // Get all profiles
      const { data: allProfiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")

      if (profilesError) throw profilesError

      // Get all group members (including removed ones)
      const { data: allGroupMembers, error: membersError } = await supabase
        .from("groupMembers")
        .select("group_member, is_removed")
        .eq("group_id", groupId)

      if (membersError) throw membersError

      // Filter out profiles that are current members (not removed)
      const currentMemberIds = new Set(
        allGroupMembers
          ?.filter(member => !member.is_removed)
          .map(member => member.group_member) || []
      )
      
      const availableProfiles = allProfiles?.filter(profile => !currentMemberIds.has(profile.id)) || []

      setAvailableProfiles(availableProfiles)
    } catch (error) {
      console.error("Error fetching available profiles:", error)
      toast.error("Failed to fetch available profiles")
    }
  }

  const handleAddMember = async (profileId: string) => {
    try {
      // Check if member already exists
      const { data: existingMember } = await supabase
        .from("groupMembers")
        .select("id")
        .eq("group_id", groupId)
        .eq("group_member", profileId)
        .single()

      if (existingMember) {
        // If member exists but was removed, update is_removed to false
        await supabase
          .from("groupMembers")
          .update({ is_removed: false })
          .eq("id", existingMember.id)
      } else {
        // If member doesn't exist, create new entry
        await supabase.from("groupMembers").insert({
          group_id: groupId,
          group_member: profileId,
          is_removed: false
        })
      }

      toast.success("Member added successfully")
      await Promise.all([fetchCurrentMembers(), fetchAvailableProfiles()])
      onMembersUpdated()
      onClose()
    } catch (error) {
      console.error("Error adding member:", error)
      toast.error("Failed to add member")
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    try {
      await supabase
        .from("groupMembers")
        .update({ is_removed: true })
        .eq("id", memberId)

      toast.success("Member removed successfully")
      await Promise.all([fetchCurrentMembers(), fetchAvailableProfiles()])
      onMembersUpdated()
      onClose()
    } catch (error) {
      console.error("Error removing member:", error)
      toast.error("Failed to remove member")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Manage Group Members</DialogTitle>
          <DialogDescription>Add or remove members from your group.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Members */}
          <div>
            <h3 className="mb-2 text-sm font-medium">Current Members</h3>
            <ScrollArea className="h-[200px] rounded-md border p-4">
              {/* Owner Section */}
              {owner && (
                <div className="flex items-center justify-between py-2 border-b mb-2">
                  <div className="flex items-center gap-3">
                    <MemberAvatar avatarUrl={owner.avatar_url} fullName={owner.full_name} />
                    <div className="flex flex-col">
                      <span className="font-medium">{owner.full_name}</span>
                      <span className="text-xs text-muted-foreground">Group Owner</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Regular Members */}
              {currentMembers
                .filter(member => member.group_member !== ownerId)
                .map((member) => (
                  <div key={member.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <MemberAvatar avatarUrl={member.profile.avatar_url} fullName={member.profile.full_name} />
                      <span>{member.profile.full_name}</span>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
            </ScrollArea>
          </div>

          {/* Available Profiles */}
          <div>
            <h3 className="mb-2 text-sm font-medium">Add Members</h3>
            <ScrollArea className="h-[200px] rounded-md border p-4">
              {availableProfiles
                .filter(profile => profile.id !== ownerId)
                .map((profile) => (
                  <div key={profile.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <MemberAvatar avatarUrl={profile.avatar_url} fullName={profile.full_name} />
                      <span>{profile.full_name}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddMember(profile.id)}
                    >
                      Add
                    </Button>
                  </div>
                ))}
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 