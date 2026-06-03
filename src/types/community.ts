export type CommunityRoomVisibility = 'public' | 'private'
export type CommunityRoomStatus = 'active' | 'archived'

export interface CommunityRoom {
  _id: string
  name: string
  slug: string
  visibility: CommunityRoomVisibility
  diseaseKey?: string
  status?: CommunityRoomStatus
  createdBy?: string
  createdAt?: string
  updatedAt?: string
  memberCount?: number
  messageCount?: number
  lastMessageAt?: string
  lastMessagePreview?: string
  unreadCount?: number
  viewerMembership?: CommunityMember
}

export type CommunityMessageStatus = 'visible' | 'hidden' | 'deleted'

export type CommunityMemberStatus = 'pending' | 'invited' | 'active' | 'left' | 'banned'
export type CommunityMemberRole = 'member' | 'moderator' | 'admin'

export interface CommunityUserSummary {
  _id: string
  firstName?: string
  lastName?: string
  avatar?: string
  email?: string
  role?: number
}

export interface CommunityMember {
  _id?: string
  roomId: string
  userId: string
  role?: CommunityMemberRole
  status?: CommunityMemberStatus
  joinedAt?: string
  updatedAt?: string
  mutedUntil?: string | null
  lastReadAt?: string
  user?: CommunityUserSummary
}

export interface CommunityMessage {
  _id: string
  roomId: string
  senderId: string
  content: string
  status: CommunityMessageStatus
  createdAt: string
  updatedAt?: string
  sender?: CommunityUserSummary
  moderated?: {
    autoHidden?: boolean
    at?: string
    severity?: string
    categories?: string[]
    confidence?: number
    reasons?: string[]
    findingId?: string
    reviewedBy?: string
    reviewedAt?: string
  }
}

export interface PaginatedResult<T> {
  items: T[]
  page: number
  limit: number
  total: number
}
