// services/laags.ts
import { createClient } from "@/utils/supabase/client"
import { Laag } from "@/types"

export const fetchLaags = async (groupId: string): Promise<Laag[]> => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("laags")
    .select(`
      *,
      organizer:profiles!organizer(id, full_name, avatar_url),
      laagImages(*),
      laagAttendees(*),
      comments(*)
    `)
    .eq("group_id", groupId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

export const deleteLaag = async (id: string): Promise<void> => {
  const supabase = createClient()
  const { error } = await supabase
    .from("laags")
    .update({ is_deleted: true })
    .eq("id", id)

  if (error) throw error
}