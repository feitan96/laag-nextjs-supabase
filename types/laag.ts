export interface LaagImage {
    id: string
    laag_id: string
    image: string
    created_at: string
    is_deleted: boolean
  }
  
  export interface LaagAttendee {
    id: string
    created_at: string
    updated_at: string
    laag_id: string
    attendee_id: string
    is_removed: boolean
    attendee: {
      id: string
      full_name: string
      avatar_url: string | null
    }
  }

  export interface Comment {
    id: string
    comment: string
    created_at: string
    updated_at: string
    user_id: string
    laag_id: string
    is_deleted: boolean
    user: {
      id: string
      full_name: string
      avatar_url: string | null
    }
  }
  
  export interface LaagNotification {
    id: string
    created_at: string
    updated_at: string
    laag_id: string
    laag_status: string
    is_read: boolean
    is_deleted: boolean
    user: {
      id: string
      full_name: string
      avatar_url: string | null
    }
  }

  // Add this new type definition
  export type LaagType = 
    | 'Birthday Celebration'
    | 'Summer Vacation'
    | 'Weekend Getaway'
    | 'Road Trip'
    | 'Beach Outing'
    | 'Hiking Adventure'
    | 'Food Trip'
    | 'Game Night'
    | 'Movie Marathon'
    | 'Study Session'
    | 'Sports Activity'
    | 'Concert/Festival'
    | 'Holiday Celebration'
    | 'Reunion'
    | 'Shopping Trip'
    | 'Staycation'
    | 'Other'
  
  // Update the Laag interface
  export interface Laag {
    id: string
    what: string
    where: string
    why: string
    type: LaagType
    estimated_cost: number
    actual_cost: number | null
    status: string
    when_start: string
    when_end: string
    fun_meter: number
    created_at: string
    updated_at: string
    group_id: string
    privacy: string
    organizer: {
      id: string
      full_name: string
      avatar_url: string | null
    }
    laagImages: LaagImage[]
    laagAttendees: LaagAttendee[]
    comments: Comment[]
    laagNotifications: LaagNotification[]
  }

  export interface Member {
    id: string
    group_member: string
    is_removed: boolean
    profile: {
      id: string
      full_name: string
      avatar_url?: string | null
    }
  }

  export interface LaagCardProps {
    laag: Laag
    members: Member[]
  }

  export interface LaagImageProps {
    imagePath: string
    onClick?: () => void
    priority?: boolean
  }

  export interface CommentCardProps {
    comment: Comment
    onDelete: () => void
  }

  export interface ImageGalleryProps {
    images: LaagImage[]
  }

  export interface LaagFeedProps {
    groupId: string
  }

  export type LaagStatus = 'planned' | 'ongoing' | 'completed' | 'cancelled'
  export type LaagPrivacy = 'public' | 'private'