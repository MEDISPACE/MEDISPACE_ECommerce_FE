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

export type CommunityVideoEventStatus = 'draft' | 'scheduled' | 'live' | 'ended' | 'cancelled'
export type CommunityVideoEventVisibility = 'public' | 'private'
export type CommunityVideoRegistrationStatus = 'registered' | 'cancelled' | 'attended' | 'no_show' | 'removed'
export type CommunityVideoQuestionStatus = 'pending' | 'approved' | 'answered' | 'hidden' | 'deleted'

export interface CommunityVideoEvent {
  _id: string
  roomId: string
  title: string
  description?: string
  agenda?: string | null
  visibility: CommunityVideoEventVisibility
  status: CommunityVideoEventStatus
  scheduledStartAt: string
  scheduledEndAt: string
  startedAt?: string | null
  endedAt?: string | null
  hostIds?: string[]
  speakerProfiles?: Array<Record<string, unknown>>
  registrationRequired?: boolean
  capacity?: number | null
  provider?: string
  providerMeetingId?: string | null
  meetingUrl?: string | null
  recordingUrl?: string | null
  recordingStatus?: 'none' | 'processing' | 'ready' | 'failed'
  materials?: Array<Record<string, unknown>>
  tags?: string[]
  createdBy?: string
  createdAt?: string
  updatedAt?: string
  room?: Pick<CommunityRoom, '_id' | 'name' | 'slug' | 'diseaseKey' | 'visibility'>
  registrationCount?: number
  viewerRegistration?: CommunityVideoEventRegistration | null
}

export interface CommunityVideoEventRegistration {
  _id?: string
  eventId: string
  roomId: string
  userId: string
  status: CommunityVideoRegistrationStatus
  role?: 'attendee' | 'host' | 'co_host'
  registeredAt?: string
  cancelledAt?: string | null
  joinedAt?: string | null
  lastSeenAt?: string | null
  reminder15mSentAt?: string | null
  user?: CommunityUserSummary
}

export interface CommunityVideoEventQuestion {
  _id: string
  eventId: string
  roomId: string
  userId: string
  content: string
  status: CommunityVideoQuestionStatus
  pinned?: boolean
  answerSummary?: string | null
  answeredBy?: string | null
  answeredAt?: string | null
  moderated?: {
    autoHidden?: boolean
    severity?: string
    categories?: string[]
    confidence?: string | number
    reasons?: string[]
  }
  createdAt: string
  updatedAt?: string
}

export interface CommunityModerationResult {
  severity?: string
  categories?: string[]
  confidence?: number
  reasons?: string[]
  autoHidden?: boolean
  shouldHide?: boolean
}

export interface CommunityVideoJoinPayload {
  eventId: string
  provider: 'livekit'
  wsUrl: string
  token: string
  role: 'attendee' | 'host'
  expiresAt: string
}
