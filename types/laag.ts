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

  export interface Laag {
    id: string
    what: string
    where: string
    why: string
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