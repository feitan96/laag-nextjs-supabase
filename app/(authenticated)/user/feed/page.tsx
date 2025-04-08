"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import type { Laag } from "@/types"
import { LaagCard } from "@/components/laags/laag-feed/laag-card"
import { useRouter } from "next/navigation"
import { useAuth } from "@/app/context/auth-context"
import { ProfileCard } from "@/components/app/profile-card"
import { FeedLayout } from "@/components/layout/feed-layout"
import { FeedLoading } from "@/components/layout/feed-loading"
import { FeedEmpty } from "@/components/layout/feed-empty"
import { GroupsCard, type Group } from "@/components/groups/my-groups-card"

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
          members: group.members || [],
        }))

        // Filter groups based on user's membership
        const userGroups = transformedData.filter(
          (group) => group.owner?.id === user?.id || group.members?.some((member) => member.group_member === user?.id),
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

  if (loading || groupsLoading) {
    return <FeedLoading />
  }

  if (laags.length === 0) {
    return <FeedEmpty rightSidebar={<GroupsCard userGroups={userGroups} />} />
  }

  // Prepare the main content
  const mainContent = (
    <>
      <h1 className="text-3xl font-bold">Public Laags</h1>
      {laags.map((laag) => (
        <div key={laag.id}>
          <LaagCard laag={laag} members={[]} />
        </div>
      ))}
    </>
  )

  return (
    <FeedLayout
      leftSidebar={<ProfileCard />}
      mainContent={mainContent}
      rightSidebar={<GroupsCard userGroups={userGroups} />}
    />
  )
}
