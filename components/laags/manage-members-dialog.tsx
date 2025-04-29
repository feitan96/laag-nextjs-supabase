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
import { Input } from "@/components/ui/input"
import { Search, Users } from "lucide-react"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

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

// Add to imports

export function ManageMembersDialog({ groupId, isOpen, onClose, onMembersUpdated, ownerId }: ManageMembersDialogProps) {
  // Add new state for confirmation dialogs
  const [confirmAction, setConfirmAction] = useState<{
    type: 'add' | 'remove';
    profileId?: string;
    memberId?: string;
    name?: string;
  } | null>(null)

  const [currentMembers, setCurrentMembers] = useState<GroupMember[]>([])
  const [availableProfiles, setAvailableProfiles] = useState<Profile[]>([])
  const [owner, setOwner] = useState<Profile | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
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
      // Get all non-admin profiles
      const { data: allProfiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, role")
        .neq('role', 'admin')

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

  // Update handleAddMember to use confirmation
  const handleAddMember = async (profileId: string, name: string) => {
    setConfirmAction({ type: 'add', profileId, name })
  }

  // Update handleRemoveMember to use confirmation
  const handleRemoveMember = async (memberId: string, name: string) => {
    setConfirmAction({ type: 'remove', memberId, name })
  }

  // Add new function to handle confirmed actions
  const handleConfirmedAction = async () => {
    if (!confirmAction) return

    try {
      if (confirmAction.type === 'add' && confirmAction.profileId) {
        // Check if member already exists in this group (including removed ones)
        const { data: existingRecords, error: fetchError } = await supabase
          .from("groupMembers")
          .select("id, is_removed")
          .eq("group_id", groupId)
          .eq("group_member", confirmAction.profileId)  // Changed this line
          .order("created_at", { ascending: false })
          .limit(1)
  
        if (fetchError) throw fetchError
  
        if (existingRecords && existingRecords.length > 0) {
          const { error: updateError } = await supabase
            .from("groupMembers")
            .update({ 
              is_removed: false,
              updated_at: new Date().toISOString()
            })
            .eq("id", existingRecords[0].id)
  
          if (updateError) throw updateError
          toast.success("Member re-added successfully")
        } else {
          const { error: insertError } = await supabase
            .from("groupMembers")
            .insert({
              group_id: groupId,
              group_member: confirmAction.profileId,  // Changed this line
              is_removed: false
            })
  
          if (insertError) throw insertError
          toast.success("New member added successfully")
        }
  
        await Promise.all([fetchCurrentMembers(), fetchAvailableProfiles()])
        onMembersUpdated()
      } else if (confirmAction.type === 'remove' && confirmAction.memberId) {
        await supabase
          .from("groupMembers")
          .update({ is_removed: true })
          .eq("id", confirmAction.memberId)

        toast.success("Member removed successfully")
        await Promise.all([fetchCurrentMembers(), fetchAvailableProfiles()])
        onMembersUpdated()
      }
    } catch (error) {
      console.error("Error managing member:", error)
      toast.error(`Failed to ${confirmAction.type} member`)
    } finally {
      setConfirmAction(null)
    }
  }

  // Add this computed value before the return statement
  const filteredAvailableProfiles = availableProfiles.filter(profile =>
    profile.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] md:max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Manage Group Members</DialogTitle>
            <DialogDescription>Add or remove members from your group.</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Current Members - Left Side */}
              <div className="flex flex-col">
                <h3 className="mb-2 text-sm font-medium">Current Members ({currentMembers.length + 1})</h3>
                <ScrollArea className="h-[300px] md:h-[400px] w-full rounded-md border">
                  <div className="p-4">
                    {/* Owner Section */}
                    {owner && (
                      <div className="flex items-center justify-between py-2 border-b mb-4">
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
                    <div className="space-y-3">
                      {currentMembers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <Users className="h-10 w-10 text-muted-foreground mb-2" />
                          <p className="text-sm font-medium">No members yet</p>
                          <p className="text-xs text-muted-foreground">Add members to your group</p>
                        </div>
                      ) : (
                        currentMembers
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
                                onClick={() => handleRemoveMember(member.id, member.profile.full_name)}
                              >
                                Remove
                              </Button>
                            </div>
                          ))
                    )}
                  </div>
                  </div>
                </ScrollArea>
              </div>

              {/* Add Members - Right Side */}
              <div className="flex flex-col">
                <h3 className="mb-2 text-sm font-medium">Add Members ({filteredAvailableProfiles.length})</h3>
                <div className="relative mb-2">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <ScrollArea className="h-[300px] md:h-[400px] w-full rounded-md border">
                  <div className="p-4">
                    <div className="space-y-3">
                      {filteredAvailableProfiles.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <Search className="h-10 w-10 text-muted-foreground mb-2" />
                          <p className="text-sm font-medium">No users found</p>
                          <p className="text-xs text-muted-foreground">
                            {searchQuery 
                              ? `No results for "${searchQuery}"`
                              : "No users available to add"}
                          </p>
                        </div>
                      ) : (
                        filteredAvailableProfiles
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
                                onClick={() => handleAddMember(profile.id, profile.full_name)}
                              >
                                Add
                              </Button>
                            </div>
                          ))
                    )}
                  </div>
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirmedAction}
        title={`${confirmAction?.type === 'add' ? 'Add' : 'Remove'} Member`}
        description={`Are you sure you want to ${confirmAction?.type === 'add' ? 'add' : 'remove'} ${confirmAction?.name} ${confirmAction?.type === 'add' ? 'to' : 'from'} the group?`}
        confirmText={confirmAction?.type === 'add' ? 'Add' : 'Remove'}
      />
    </>
  )
}