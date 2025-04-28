export interface User {
  id: string
  email: string
  profile: Profile
}

export interface Profile {
  id: string
  updated_at: string | null
  username: string | null
  full_name: string | null
  avatar_url: string | null
  website: string | null
  is_deleted: boolean
  role: string
  email: string | null
  is_darkmode: boolean
  is_allow_notifications: boolean
}