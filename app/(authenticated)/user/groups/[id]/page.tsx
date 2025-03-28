"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { useParams } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, Edit2, Settings } from "lucide-react"
import { useGroupPicture } from "@/hooks/useGroupPicture"
import { useAvatar } from "@/hooks/useAvatar"
import Image from "next/image"
import { CreateLaagDialog } from "./create-laag-dialog"
import { LaagFeed } from "./laag-feed"
import { EditGroupModal } from "@/components/edit-group-modal"
import { ManageMembersDialog } from "./manage-members-dialog"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/app/context/auth-context"
import { toast } from "sonner"

interface Group {
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
    profile: {
      id: string
      full_name: string
      avatar_url?: string | null
    }
  }[]
  is_deleted: boolean
}

interface MemberAvatarProps {
  avatarUrl: string | null
  fullName: string
}

function MemberAvatar({ avatarUrl, fullName }: MemberAvatarProps) {
  const memberAvatarUrl = useAvatar(avatarUrl)
  return (
    <Avatar>
      <AvatarImage src={memberAvatarUrl || undefined} />
      <AvatarFallback>{fullName.charAt(0)}</AvatarFallback>
    </Avatar>
  )
}

export default function GroupFeed() {
  const params = useParams()
  const [group, setGroup] = useState<Group | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isManageMembersOpen, setIsManageMembersOpen] = useState(false)
  const supabase = createClient()
  const { user } = useAuth()
  const groupPictureUrl = useGroupPicture(group?.group_picture || null)

  const fetchGroup = async () => {
    try {
      const { data, error } = await supabase
        .from("groups")
        .select(`
          id,
          group_name,
          no_members,
          created_at,
          group_picture,
          is_deleted,
          owner:profiles!owner(id, full_name, avatar_url),
          members:groupMembers(
            id,
            group_member,
            is_removed,
            profile:profiles(id, full_name, avatar_url)
          )
        `)
        .eq("id", params.id)
        .eq("is_deleted", false)
        .single()

      if (error) throw error

      // Transform the data to match our Group interface
      const transformedData = {
        ...data,
        owner: Array.isArray(data.owner) ? data.owner[0] : data.owner,
        members: (data.members || []).map(member => ({
          ...member,
          profile: Array.isArray(member.profile) ? member.profile[0] : member.profile
        }))
      }

      setGroup(transformedData)
    } catch (error) {
      console.error("Error fetching group:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGroup()
  }, [supabase, params.id])

  const handleEditGroup = async (groupId: string, newName: string) => {
    try {
      const { error } = await supabase
        .from("groups")
        .update({ group_name: newName })
        .eq("id", groupId)
        .select()

      if (error) throw error

      toast.success("Group updated successfully")
      fetchGroup()
      setIsEditModalOpen(false)
    } catch (error) {
      console.error("Error updating group:", error)
      toast.error("Failed to update group")
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-[200px]" />
            <Skeleton className="h-4 w-[150px]" />
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-8 w-[100px]" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Group not found</h2>
          <p className="text-muted-foreground">The group you&apos;re looking for doesn&apos;t exist or has been deleted.</p>
        </div>
      </div>
    )
  }

  const isOwner = user?.id === group.owner?.id

  return (
    <div className="space-y-6 p-6">
      {/* Group Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            {groupPictureUrl ? (
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
          <div>
            <h1 className="text-2xl font-semibold">{group.group_name}</h1>
          </div>
        </div>
        {isOwner && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)}>
              <Edit2 className="mr-2 h-4 w-4" />
              Edit Group
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsManageMembersOpen(true)}>
              <Settings className="mr-2 h-4 w-4" />
              Manage Members
            </Button>
          </div>
        )}
      </div>

      {/* Group Members */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Members</h2>
          <Badge variant="secondary">{group.no_members} members</Badge>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {/* Owner Section */}
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <MemberAvatar avatarUrl={group.owner.avatar_url || null} fullName={group.owner.full_name} />
            <div>
              <p className="font-medium">{group.owner.full_name}</p>
              <p className="text-sm text-muted-foreground">Group Owner</p>
            </div>
          </div>

          {/* Regular Members */}
          {group.members
            ?.filter(member => !member.is_removed)
            .map((member) => (
              <div key={member.id} className="flex items-center gap-3 rounded-lg border p-3">
                <MemberAvatar avatarUrl={member.profile.avatar_url || null} fullName={member.profile.full_name} />
                <div>
                  <p className="font-medium">{member.profile.full_name}</p>
                  <p className="text-sm text-muted-foreground">Member</p>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Laags Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Laags</h2>
          <CreateLaagDialog 
            groupId={group.id} 
            onLaagCreated={() => window.location.reload()} 
            members={group.members || []}
          />
        </div>
        <LaagFeed groupId={group.id} />
      </div>

      {/* Modals */}
      <EditGroupModal
        group={group}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleEditGroup}
      />

      <ManageMembersDialog
        groupId={group.id}
        isOpen={isManageMembersOpen}
        onClose={() => setIsManageMembersOpen(false)}
        onMembersUpdated={fetchGroup}
        ownerId={group.owner.id}
      />
    </div>
  )
} 