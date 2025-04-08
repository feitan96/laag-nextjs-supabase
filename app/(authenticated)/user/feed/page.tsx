"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Laag } from "@/types"
import { LaagCard } from "@/components/laags/laag-feed/laag-card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Users } from "lucide-react"
import { useGroupPicture } from "@/hooks/useGroupPicture"
import Image from "next/image"
import { useAuth } from "@/app/context/auth-context"
import { ScrollArea } from "@/components/ui/scroll-area"

const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 5px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: #d4d4d8;
    border-radius: 20px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: #a1a1aa;
  }

  /* Prevent body scrolling */
  body {
    overflow: hidden;
  }
`


// Define the Group interface
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
  }[]
  is_deleted: boolean
}

export default function PublicFeed() {
  const [laags, setLaags] = useState<Laag[]>([])
  const [loading, setLoading] = useState(true)
  const [userGroups, setUserGroups] = useState<Group[]>([])
  const [groupsLoading, setGroupsLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    const fetchLaags = async () => {
      try {
        const { data, error } = await supabase
          .from("laags")
          .select(`
            *,
            organizer:profiles!organizer(id, full_name, avatar_url),
            laagImages(*),
            laagAttendees(*),
            comments(
              id,
              comment,
              created_at,
              updated_at,
              user_id,
              laag_id,
              is_deleted,
              user:profiles(id, full_name, avatar_url)
            )
          `)
          .eq("is_deleted", false)
          .eq("privacy", "public")
          .order("created_at", { ascending: false })

        if (error) throw error
        setLaags(data)
      } catch (error) {
        console.error("Error fetching laags:", error)
      } finally {
        setLoading(false)
      }
    }

    const fetchUserGroups = async () => {
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
            members:groupMembers(id, group_member, is_removed)
          `)
          .eq("is_deleted", false)

        if (error) throw error

        // Transform the data to match our Group interface
        const transformedData = (data || []).map((group) => ({
          ...group,
          owner: Array.isArray(group.owner) ? group.owner[0] : group.owner,
          members: group.members || []
        }))

        // Filter groups based on user's membership
        const userGroups = transformedData.filter(
          (group) => group.owner?.id === user?.id || group.members?.some((member) => member.group_member === user?.id)
        )

        setUserGroups(userGroups)
      } catch (error) {
        console.error("Error fetching user groups:", error)
      } finally {
        setGroupsLoading(false)
      }
    }

    fetchLaags()
    fetchUserGroups()
  }, [supabase, user?.id])

  // Add this useEffect to handle the scrollbar styles
  useEffect(() => {
    // Add the scrollbar styles to the document
    const styleElement = document.createElement("style")
    styleElement.innerHTML = scrollbarStyles
    document.head.appendChild(styleElement)
  
    return () => {
      // Clean up the style element when the component unmounts
      document.head.removeChild(styleElement)
    }
  }, [])

  if (loading || groupsLoading) {
    return (
      <div className="h-screen overflow-hidden">
        <div className="container max-w-[1200px] py-6 h-full">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-6 overflow-y-auto">
              {Array.from({ length: 2 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[180px]" />
                        <Skeleton className="h-3 w-[120px]" />
                      </div>
                    </div>
                  </div>
                  <div className="p-4 pt-0">
                    <Skeleton className="h-6 w-[70%] mb-3" />
                    <Skeleton className="h-4 w-[40%] mb-3" />
                    <Skeleton className="h-20 w-full mb-4" />
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <Skeleton className="h-16 rounded-lg" />
                      <Skeleton className="h-16 rounded-lg" />
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <Skeleton className="aspect-square rounded-md" />
                      <Skeleton className="aspect-square rounded-md" />
                    </div>
                  </div>
                  <div className="p-4 pt-0">
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-20 rounded-full" />
                      <Skeleton className="h-6 w-32 rounded-full" />
                      <Skeleton className="h-6 w-24 rounded-full" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <div className="md:w-[300px]">
              <div className="sticky top-6">
                <Card className="overflow-hidden">
                  <div className="p-4 border-b">
                    <Skeleton className="h-6 w-[120px]" />
                    <Skeleton className="h-4 w-[180px] mt-2" />
                  </div>
                  <div className="p-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg border mb-3">
                        <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div>
                          <Skeleton className="h-5 w-[120px]" />
                          <Skeleton className="h-4 w-[100px] mt-1" />
                        </div>
                      </div>
                      <Skeleton className="h-8 w-20" />
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
      </div>
    )
  }

  if (laags.length === 0) {
    return (
      <div className="h-screen overflow-hidden">
        <div className="container max-w-[1200px] py-6 h-full">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <Card className="flex h-[200px] items-center justify-center border-dashed bg-muted/20">
                <div className="text-center">
                  <p className="text-muted-foreground mb-2">No public laags yet</p>
                  <p className="text-xs text-muted-foreground">Be the first to create one!</p>
                </div>
              </Card>
            </div>
            <div className="md:w-[300px]">
              <div className="sticky top-6">
                <GroupsCard userGroups={userGroups} router={router} />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen overflow-hidden">
      <div className="container max-w-[1200px] py-6 h-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
          {/* Left Main Content - Scrollable */}
          <div className="md:col-span-2 h-full overflow-y-auto custom-scrollbar pr-2">
            <div className="space-y-6">
              <h1 className="text-3xl font-bold">Public Laags</h1>
              {laags.map((laag) => (
                <LaagCard key={laag.id} laag={laag} members={[]} />
              ))}
            </div>
          </div>
  
          {/* Right Sub Content - Sticky */}
          <div className="h-full">
            <Card className="h-full overflow-hidden">
              <div className="p-4 border-b">
                <h2 className="text-xl font-semibold">My Groups</h2>
                <p className="text-sm text-muted-foreground">Groups you&apos;re a member of</p>
              </div>
              <div className="p-4 h-[calc(100%-5rem)]">
                <ScrollArea className="h-full pr-4 custom-scrollbar">
                  {userGroups.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground">You are not a member of any groups.</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => router.push('/user/groups')}
                      >
                        Browse Groups
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {userGroups.map((group) => (
                        <GroupRow key={group.id} group={group} />
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
  
  
}

// Separate component for groups card
function GroupsCard({ userGroups, router }: { userGroups: Group[], router: ReturnType<typeof useRouter> }) {
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
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => router.push('/user/groups')}
            >
              Browse Groups
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {userGroups.map((group) => (
              <GroupRow key={group.id} group={group} />
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}

// Separate component for group row to avoid hook issues
function GroupRow({ group }: { group: Group }) {
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
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => router.push(`/user/groups/${group.id}`)}
      >
        View
      </Button>
    </div>
  )
} 