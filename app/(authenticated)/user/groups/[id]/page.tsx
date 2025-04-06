"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { useParams } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, Edit2, Settings, User2 } from "lucide-react"
import { useGroupPicture } from "@/hooks/useGroupPicture"
import { useAvatar } from "@/hooks/useAvatar"
import Image from "next/image"
import { CreateLaagDialog } from "../../../../../components/laags/create-laag-dialog"
import { LaagFeed } from "../../../../../components/laags/laag-feed"
import { EditGroupModal } from "@/components/groups/edit-group-dialog"
import { ManageMembersDialog } from "../../../../../components/laags/manage-members-dialog"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/app/context/auth-context"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

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
        members: (data.members || []).map((member) => ({
          ...member,
          profile: Array.isArray(member.profile) ? member.profile[0] : member.profile,
        })),
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
      const { error } = await supabase.from("groups").update({ group_name: newName }).eq("id", groupId).select()

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
      <div className="container max-w-[1200px] py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-8">
            <div className="flex items-center gap-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-[250px]" />
                <Skeleton className="h-5 w-[180px]" />
              </div>
            </div>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-[150px]" />
                <Skeleton className="h-9 w-[120px]" />
              </div>
              <Skeleton className="h-[400px] w-full rounded-lg" />
            </div>
          </div>
          <div>
            <Card className="overflow-hidden sticky top-6">
              <CardHeader>
                <Skeleton className="h-6 w-[120px]" />
                <Skeleton className="h-4 w-[180px] mt-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Skeleton className="h-5 w-[80px]" />
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div>
                        <Skeleton className="h-5 w-[120px]" />
                        <Skeleton className="h-4 w-[100px] mt-1" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Skeleton className="h-5 w-[80px]" />
                    <div className="grid gap-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div>
                            <Skeleton className="h-5 w-[120px]" />
                            <Skeleton className="h-4 w-[100px] mt-1" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="container max-w-[1200px] py-12">
        <div className="flex h-[50vh] items-center justify-center">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Group not found</CardTitle>
              <CardDescription>The group you&apos;re looking for doesn&apos;t exist or has been deleted.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    )
  }

  const isOwner = user?.id === group.owner?.id
  const activeMembers = group.members?.filter((member) => !member.is_removed) || []

  return (
    <div className="container max-w-[1200px] py-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-8">
          {/* Group Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center">
                {groupPictureUrl ? (
                  <Image
                    src={groupPictureUrl || "/placeholder.svg"}
                    alt={group.group_name}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/default-group-picture.png"
                    }}
                  />
                ) : (
                  <Users className="h-10 w-10 text-primary" />
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold">{group.group_name}</h1>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User2 className="h-4 w-4" />
                  <span>{group.no_members} members</span>
                </div>
              </div>
            </div>
            {isOwner && (
              <div className="flex items-center gap-2 mt-2 sm:mt-0">
                <Button variant="outline" onClick={() => setIsEditModalOpen(true)}>
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit Group
                </Button>
                <Button variant="outline" onClick={() => setIsManageMembersOpen(true)}>
                  <Settings className="mr-2 h-4 w-4" />
                  Manage Members
                </Button>
              </div>
            )}
          </div>

          {/* Group Feed */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Group Activities</h2>
              <CreateLaagDialog
                groupId={group.id}
                onLaagCreated={() => window.location.reload()}
                members={group.members || []}
              />
            </div>
            <LaagFeed groupId={group.id} />
          </div>
        </div>

        {/* Members Card */}
        <div>
          <Card className="overflow-hidden sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Members</span>
                <Badge variant="secondary">{group.no_members} total</Badge>
              </CardTitle>
              <CardDescription>People who are part of this group</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[calc(100vh-250px)] pr-4">
                <div className="space-y-6">
                  {/* Owner Section */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground">Owner</h3>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      <MemberAvatar avatarUrl={group.owner.avatar_url || null} fullName={group.owner.full_name} />
                      <div>
                        <p className="font-medium">{group.owner.full_name}</p>
                        <p className="text-xs text-muted-foreground">Group Owner</p>
                      </div>
                    </div>
                  </div>

                  {/* Regular Members */}
                  {activeMembers.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-muted-foreground">Members</h3>
                      <div className="grid gap-3">
                        {activeMembers.map((member) => (
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
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
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

