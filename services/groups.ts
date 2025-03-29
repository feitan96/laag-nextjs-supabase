// services/groups.ts
import { createClient } from "@/utils/supabase/client"
import { GroupMember } from "@/types"

export const fetchGroupMembers = async (groupId: string): Promise<GroupMember[]> => {
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

  return data.map(member => ({
    ...member,
    profile: Array.isArray(member.profile) ? member.profile[0] : member.profile
  }))
}