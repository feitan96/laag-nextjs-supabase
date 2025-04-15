// services/laags.ts
import { createClient } from "@/utils/supabase/client"
import { Laag, Member } from "@/types"
import { Slider } from "@/components/ui/slider"

export const fetchLaags = async (groupId: string): Promise<Laag[]> => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("laags")
    .select(`
      *,
      organizer:profiles!organizer(id, full_name, avatar_url),
      laagImages(*),
      laagAttendees(
        id,
        attendee_id,
        is_removed,
        attendee:profiles(id, full_name, avatar_url)
      ),
      comments:comments!laag_id(
        *,
        user:profiles!user_id(id, full_name, avatar_url)
      )
    `)
    .eq("group_id", groupId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })

  if (error) throw error
  
  // Process attendees to ensure uniqueness
  const processedData = data.map(laag => ({
    ...laag,
    laagAttendees: laag.laagAttendees
      // Filter to show only unique attendees
      .filter((attendee, index, self) =>
        index === self.findIndex(a => a.attendee_id === attendee.attendee_id)
      )
  }))

  return processedData
}

export const fetchMembers = async (groupId: string): Promise<Member[]> => {
  const supabase = createClient()
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

  return (data || []).map((member) => ({
    ...member,
    profile: Array.isArray(member.profile) ? member.profile[0] : member.profile,
  }))
}

export const deleteLaag = async (id: string): Promise<void> => {
  const supabase = createClient()
  const { error } = await supabase
    .from("laags")
    .update({ is_deleted: true })
    .eq("id", id)

  if (error) throw error
}

export const addComment = async (laagId: string, comment: string): Promise<void> => {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error("User not authenticated")

  const { error } = await supabase.from("comments").insert({
    comment: comment.trim(),
    user_id: user.id,
    laag_id: laagId,
  })

  if (error) throw error
}

export const updateComment = async (commentId: string, comment: string): Promise<void> => {
  const supabase = createClient()
  const { error } = await supabase
    .from("comments")
    .update({ comment })
    .eq("id", commentId)

  if (error) throw error
}

export const deleteComment = async (commentId: string): Promise<void> => {
  const supabase = createClient()
  const { error } = await supabase
    .from("comments")
    .update({ is_deleted: true })
    .eq("id", commentId)

  if (error) throw error
}

export const getStatusVariant = (status: string): "outline" | "secondary" | "default" | "destructive" => {
  switch (status.toLowerCase()) {
    case "planned":
      return "outline"
    case "ongoing":
      return "secondary"
    case "completed":
      return "default"
    case "cancelled":
      return "destructive"
    default:
      return "outline"
  }
}

// Add these new functions
export const submitFunMeter = async (laagId: string, groupId: string, funMeter: number): Promise<void> => {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error("User not authenticated")

  const { error } = await supabase.from("laagFunMeter").insert({
    fun_meter: funMeter,
    laag_id: laagId,
    user_id: user.id,
    group_id: groupId
  })

  if (error) throw error
}

export const updateFunMeter = async (funMeterId: string, funMeter: number): Promise<void> => {
  const supabase = createClient()
  const { error } = await supabase
    .from("laagFunMeter")
    .update({ fun_meter: funMeter })
    .eq("id", funMeterId)

  if (error) throw error
}

export const deleteFunMeter = async (funMeterId: string): Promise<void> => {
  const supabase = createClient()
  const { error } = await supabase
    .from("laagFunMeter")
    .update({ is_deleted: true })
    .eq("id", funMeterId)

  if (error) throw error
}