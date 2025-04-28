import { createClient } from "@/utils/supabase/client"

const supabase = createClient()

export async function getAllUsers() {
  const { data: currentUser } = await supabase.auth.getUser()
  
  // Get current user's role from profiles
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', currentUser.user?.id)
    .single()

  if (userProfile?.role !== 'admin') {
    throw new Error('Not authorized. Admin access required.')
  }

  const { data, error } = await supabase
    .from('profiles')
    .select()
    .eq('is_deleted', false)
    .order('full_name', { ascending: true })

  if (error) {
    console.error('Supabase error:', error)
    throw error
  }

  return data
}

export async function softDeleteUser(userId: string) {
  const { data: currentUser } = await supabase.auth.getUser()
  
  // Get current user's role from profiles
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', currentUser.user?.id)
    .single()

  if (userProfile?.role !== 'admin') {
    throw new Error('Not authorized. Admin access required.')
  }

  const { error } = await supabase
    .from('profiles')
    .update({ is_deleted: true })
    .eq('id', userId)

  if (error) throw error
  return true
}