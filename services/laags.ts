// services/laags.ts
import { createClient } from "@/utils/supabase/client"
import { Laag, Member } from "@/types"

export const fetchLaags = async (groupId: string): Promise<Laag[]> => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("laags")
    .select(`
      *,
      type,
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
export const calculateAndUpdateAverageFunMeter = async (laagId: string): Promise<number> => {
  const supabase = createClient()
  
  // First get the laag to get the organizer id
  const { data: laag, error: laagError } = await supabase
    .from("laags")
    .select("organizer")
    .eq("id", laagId)
    .single()

  if (laagError) throw laagError

  // Get all non-deleted fun meter ratings for this laag
  const { data: funMeterRatings, error: fetchError } = await supabase
    .from("laagFunMeter")
    .select("fun_meter")
    .eq("laag_id", laagId)
    .eq("is_deleted", false)

  if (fetchError) throw fetchError

  // Calculate the new fun meter value
  const newFunMeter = (!funMeterRatings || funMeterRatings.length === 0) 
    ? null 
    : funMeterRatings.reduce((acc, curr) => acc + curr.fun_meter, 0) / funMeterRatings.length

  // Update using the organizer's context
  const { error: updateError } = await supabase.rpc('update_laag_fun_meter', { 
    p_laag_id: laagId,
    p_fun_meter: newFunMeter,
    p_organizer_id: laag.organizer
  })

  if (updateError) throw updateError

  return newFunMeter || 0
}

// Modify the existing submitFunMeter function
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

  // Calculate and update the average after submission
  await calculateAndUpdateAverageFunMeter(laagId)
}

// Modify the existing updateFunMeter function
export const updateFunMeter = async (funMeterId: string, funMeter: number): Promise<void> => {
  const supabase = createClient()
  
  // First get the laag_id for this fun meter
  const { data: funMeterData, error: fetchError } = await supabase
    .from("laagFunMeter")
    .select("laag_id")
    .eq("id", funMeterId)
    .single()

  if (fetchError) throw fetchError

  // Update the fun meter value
  const { error: updateError } = await supabase
    .from("laagFunMeter")
    .update({ fun_meter: funMeter })
    .eq("id", funMeterId)

  if (updateError) throw updateError

  // Calculate and update the average
  await calculateAndUpdateAverageFunMeter(funMeterData.laag_id)
}

// Modify the existing deleteFunMeter function
export const deleteFunMeter = async (funMeterId: string): Promise<void> => {
  const supabase = createClient()
  
  // First get the laag_id for this fun meter
  const { data: funMeterData, error: fetchError } = await supabase
    .from("laagFunMeter")
    .select("laag_id")
    .eq("id", funMeterId)
    .single()

  if (fetchError) throw fetchError

  // Mark the fun meter as deleted
  const { error: updateError } = await supabase
    .from("laagFunMeter")
    .update({ is_deleted: true })
    .eq("id", funMeterId)

  if (updateError) throw updateError

  // Calculate and update the average
  await calculateAndUpdateAverageFunMeter(funMeterData.laag_id)
}