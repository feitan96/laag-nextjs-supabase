import { SupabaseClient } from '@supabase/supabase-js'

export async function getUserRole(supabase: SupabaseClient) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (error) throw error
    return data.role
  } catch (error) {
    console.error("Error fetching role:", error)
    return null
  }
}