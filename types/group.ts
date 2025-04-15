// types/group.ts
export interface GroupMember {
    id: string
    group_member: string
    is_removed: boolean
    profile: {
      id: string
      full_name: string
      avatar_url: string | null
    }
  }
  
  export interface Group {
    id: string
    group_name: string
    group_picture: string | null
    no_members: number
    created_at: string
    updated_at: string
    is_deleted: boolean
    privacy: string
    creator_id: string
    groupMembers: GroupMember[]
    organizer: {
        id: string
        full_name: string
        avatar_url: string | null
      }
  }