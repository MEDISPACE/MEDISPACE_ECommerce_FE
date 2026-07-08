export type CommunityRoomVisibility = 'public' | 'private'
export type CommunityRoomStatus = 'active' | 'archived'

export interface CommunityRoom {
  _id: string
  name: string
  slug: string
  visibility: CommunityRoomVisibility
  diseaseKey?: string
  topicLabel?: string
  description?: string
  iconKey?: string
  coverImage?: string
  guidelines?: string[]
  pinnedMessage?: string
  featured?: boolean
  sortOrder?: number
  status?: CommunityRoomStatus
  createdBy?: string
  createdAt?: string
  updatedAt?: string
  memberCount?: number
  pendingMemberCount?: number
  messageCount?: number
  lastMessageAt?: string
  lastMessagePreview?: string
  unreadCount?: number
  viewerMembership?: CommunityMember
}

export type CommunityMessageStatus = 'visible' | 'hidden' | 'deleted'
export type CommunityReactionType = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry' | 'helpful' | 'thanks' | 'care' | 'dislike'

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
  videoEventId?: string
  threadId?: string
  senderId: string
  content: string
  imageUrl?: string
  replyToMessageId?: string
  isThreadStarter?: boolean
  replyTo?: Pick<
    CommunityMessage,
    '_id' | 'roomId' | 'senderId' | 'content' | 'imageUrl' | 'status' | 'createdAt' | 'sender'
  > | null
  status: CommunityMessageStatus
  createdAt: string
  updatedAt?: string
  editedAt?: string
  deletedAt?: string
  sender?: CommunityUserSummary
  reactionCounts?: Partial<Record<CommunityReactionType, number>>
  viewerReaction?: CommunityReactionType | null
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

export type CommunityThreadPrefix = 'question' | 'review' | 'warning' | 'story' | 'experience' | 'pharmacist'
export type CommunityThreadStatus = 'open' | 'answered' | 'hidden' | 'deleted'
export type CommunityThreadVideoMeetingStatus = 'scheduled' | 'live' | 'ended'

export interface CommunityThreadVideoMeeting {
  url: string
  eventId?: string
  provider?: 'google_meet' | 'zoom' | 'teams' | 'other' | string
  status: CommunityThreadVideoMeetingStatus
  startsAt?: string
  endsAt?: string
  title?: string
  note?: string
  updatedBy?: string
  updatedAt?: string
}

export interface CommunityThread {
  _id: string
  roomId: string
  title: string
  slug: string
  prefix: CommunityThreadPrefix
  authorId: string
  isAnonymous?: boolean
  content: string
  imageUrl?: string
  videoMeeting?: CommunityThreadVideoMeeting
  tags?: string[]
  status: CommunityThreadStatus
  sticky?: boolean
  locked?: boolean
  starterMessageId?: string
  acceptedReplyId?: string
  viewCount?: number
  replyCount?: number
  lastReplyAt?: string
  lastReplyId?: string
  lastReplyPreview?: string
  createdAt: string
  updatedAt?: string
  author?: CommunityUserSummary
  room?: Pick<CommunityRoom, '_id' | 'name' | 'slug' | 'diseaseKey' | 'topicLabel' | 'visibility' | 'viewerMembership'>
  starterMessage?: CommunityMessage
  acceptedReply?: CommunityMessage
}

export interface PaginatedResult<T> {
  items: T[]
  page: number
  limit: number
  total: number
}

export type CommunityVideoEventStatus = 'draft' | 'scheduled' | 'live' | 'ended' | 'cancelled'
export type CommunityVideoRegistrationStatus = 'registered' | 'cancelled' | 'attended' | 'no_show' | 'removed'

export interface CommunityVideoEvent {
  _id: string
  roomId: string
  title: string
  description?: string
  agenda?: string | null
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

export interface CommunityVideoEventLiveTrack {
  sid: string
  name: string
  source: 'microphone' | 'camera' | 'screen_share' | 'screen_share_audio' | 'unknown'
  muted: boolean
}

export interface CommunityVideoEventLiveParticipant {
  identity: string
  name: string
  metadata?: {
    userId?: string
    avatar?: string
    role?: string
    [key: string]: unknown
  } | null
  joinedAt?: string
  audioPublishAllowed?: boolean
  cameraPublishAllowed?: boolean
  screenSharePublishAllowed?: boolean
  tracks: CommunityVideoEventLiveTrack[]
}

export interface CommunityVideoEventLiveParticipantsPayload {
  eventId: string
  roomName: string
  participants: CommunityVideoEventLiveParticipant[]
}

export interface CommunityVideoEventModerationActionPayload {
  eventId: string
  userId: string
  action:
    | 'muted'
    | 'camera-disabled'
    | 'screen-share-disabled'
    | 'audio-enabled'
    | 'camera-enabled'
    | 'screen-share-enabled'
    | 'kicked'
    | 'banned'
  track?: CommunityVideoEventLiveTrack
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

export interface CommunityLiveKitDiagnostics {
  configured: boolean
  reachable: boolean
  wsUrl: string
  httpUrl?: string
  reason?: string
  statusCode?: number
}
