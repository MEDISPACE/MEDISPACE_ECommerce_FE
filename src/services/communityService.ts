import apiClient from '~/services/apiClient'
import type {
  CommunityRoom,
  CommunityMessage,
  CommunityMember,
  CommunityModerationResult,
  CommunityLiveKitDiagnostics,
  CommunityVideoEvent,
  CommunityVideoEventLiveParticipantsPayload,
  CommunityVideoEventModerationActionPayload,
  CommunityVideoEventRegistration,
  CommunityVideoJoinPayload,
  CommunityThread,
  CommunityThreadVideoMeeting,
  CommunityThreadPrefix,
  CommunityMemberStatus,
  CommunityReactionType,
  PaginatedResult,
} from '~/types/community'

type Envelope<T> = { message?: string; data?: T; result?: T }

function unwrap<T>(envelope: Envelope<T>): T {
  if (envelope.data !== undefined) return envelope.data
  if (envelope.result !== undefined) return envelope.result
  throw new Error(envelope.message || 'Unexpected API response shape')
}

export const communityService = {
  async listRooms(params?: {
    visibility?: 'public' | 'private'
    diseaseKey?: string
    search?: string
    sort?: 'activity' | 'newest' | 'members' | 'messages' | 'featured'
  }) {
    const res = await apiClient.get<Envelope<CommunityRoom[]>>('/community/rooms', { params })
    return unwrap(res.data)
  },

  async listMyRooms(params?: {
    visibility?: 'public' | 'private'
    diseaseKey?: string
    search?: string
    sort?: 'activity' | 'newest' | 'members' | 'messages' | 'featured'
  }) {
    const res = await apiClient.get<Envelope<CommunityRoom[]>>('/community/rooms/my', { params })
    return unwrap(res.data)
  },

  async joinRoom(roomId: string) {
    const res = await apiClient.post<Envelope<{ roomId: string; userId: string; status: CommunityMemberStatus }>>(
      `/community/rooms/${roomId}/join`,
    )
    return unwrap(res.data)
  },

  async requestJoin(roomId: string) {
    const res = await apiClient.post<Envelope<{ roomId: string; userId: string; status: CommunityMemberStatus }>>(
      `/community/rooms/${roomId}/join-request`,
    )
    return unwrap(res.data)
  },

  async leaveRoom(roomId: string) {
    const res = await apiClient.post<Envelope<{ roomId: string; userId: string; status: string }>>(
      `/community/rooms/${roomId}/leave`,
    )
    return unwrap(res.data)
  },

  async markRoomRead(roomId: string) {
    const res = await apiClient.post<Envelope<{ roomId: string; userId: string; lastReadAt: string }>>(
      `/community/rooms/${roomId}/read`,
    )
    return unwrap(res.data)
  },

  async listThreads(params: {
    roomId: string
    page: number
    limit: number
    q?: string
    prefix?: CommunityThreadPrefix | 'all'
    sort?: 'latest' | 'newest' | 'hot' | 'unanswered'
  }) {
    const res = await apiClient.get<Envelope<PaginatedResult<CommunityThread>>>(
      `/community/rooms/${params.roomId}/threads`,
      {
        params: {
          page: params.page,
          limit: params.limit,
          q: params.q || undefined,
          prefix: params.prefix && params.prefix !== 'all' ? params.prefix : undefined,
          sort: params.sort,
        },
      },
    )
    return unwrap(res.data)
  },

  async createThread(params: {
    roomId: string
    title: string
    content: string
    prefix?: CommunityThreadPrefix
    isAnonymous?: boolean
    imageUrl?: string
  }) {
    const res = await apiClient.post<
      Envelope<{ thread: CommunityThread; moderation: CommunityModerationResult; memberRole?: string }>
    >(`/community/rooms/${params.roomId}/threads`, {
      title: params.title,
      content: params.content,
      prefix: params.prefix,
      isAnonymous: params.isAnonymous,
      imageUrl: params.imageUrl,
    })
    return unwrap(res.data)
  },

  async getThread(threadId: string) {
    const res = await apiClient.get<Envelope<CommunityThread>>(`/community/threads/${threadId}`)
    return unwrap(res.data)
  },

  async listThreadReplies(params: { threadId: string; page: number; limit: number }) {
    const res = await apiClient.get<Envelope<PaginatedResult<CommunityMessage>>>(
      `/community/threads/${params.threadId}/replies`,
      { params: { page: params.page, limit: params.limit } },
    )
    return unwrap(res.data)
  },

  async createThreadReply(params: { threadId: string; content?: string; imageUrl?: string; replyToMessageId?: string }) {
    const res = await apiClient.post<
      Envelope<{ message: CommunityMessage; moderation: CommunityModerationResult; memberRole?: string }>
    >(`/community/threads/${params.threadId}/replies`, {
      content: params.content || '',
      imageUrl: params.imageUrl,
      replyToMessageId: params.replyToMessageId,
    })
    return unwrap(res.data)
  },

  async listMessages(params: { roomId: string; page: number; limit: number; q?: string }) {
    const res = await apiClient.get<Envelope<PaginatedResult<CommunityMessage>>>(
      `/community/rooms/${params.roomId}/messages`,
      { params: { page: params.page, limit: params.limit, q: params.q || undefined } },
    )
    return unwrap(res.data)
  },

  async sendMessage(params: { roomId: string; content?: string; imageUrl?: string; replyToMessageId?: string }) {
    const res = await apiClient.post<
      Envelope<{ message: CommunityMessage; moderation: CommunityModerationResult; memberRole?: string }>
    >(`/community/rooms/${params.roomId}/messages`, {
      content: params.content || '',
      imageUrl: params.imageUrl,
      replyToMessageId: params.replyToMessageId,
    })
    return unwrap(res.data)
  },

  async reportMessage(params: { messageId: string; reason?: string }) {
    const res = await apiClient.post<Envelope<any>>(`/community/messages/${params.messageId}/report`, {
      reason: params.reason,
    })
    return unwrap(res.data)
  },

  async reactToMessage(params: { messageId: string; type: CommunityReactionType | null }) {
    const res = await apiClient.post<Envelope<{ messageId: string; reactionCounts: Partial<Record<CommunityReactionType, number>>; viewerReaction: CommunityReactionType | null }>>(
      `/community/messages/${params.messageId}/reaction`,
      { type: params.type },
    )
    return unwrap(res.data)
  },

  async updateMessage(params: { messageId: string; content: string; imageUrl?: string }) {
    const res = await apiClient.patch<Envelope<{ message: CommunityMessage; moderation?: CommunityModerationResult }>>(
      `/community/messages/${params.messageId}`,
      { content: params.content, imageUrl: params.imageUrl },
    )
    return unwrap(res.data)
  },

  async deleteMessage(messageId: string) {
    const res = await apiClient.delete<Envelope<{ message: CommunityMessage }>>(`/community/messages/${messageId}`)
    return unwrap(res.data)
  },

  async createAppeal(params: { roomId: string; type: 'ban' | 'mute' | 'message'; reason: string; messageId?: string }) {
    const res = await apiClient.post<Envelope<any>>(`/community/rooms/${params.roomId}/appeals`, {
      type: params.type,
      reason: params.reason,
      messageId: params.messageId,
    })
    return unwrap(res.data)
  },

  async listVideoEvents(params?: {
    roomId?: string
    status?: string
    search?: string
    upcomingOnly?: boolean
    page?: number
    limit?: number
  }) {
    const res = await apiClient.get<Envelope<PaginatedResult<CommunityVideoEvent>>>('/community/video-events', {
      params,
    })
    return unwrap(res.data)
  },

  async listMyVideoEvents(params?: { status?: string; page?: number; limit?: number }) {
    const res = await apiClient.get<Envelope<PaginatedResult<CommunityVideoEvent>>>('/community/video-events/my', {
      params,
    })
    return unwrap(res.data)
  },

  async getVideoEvent(eventId: string) {
    const res = await apiClient.get<Envelope<CommunityVideoEvent>>(`/community/video-events/${eventId}`)
    return unwrap(res.data)
  },

  async registerVideoEvent(eventId: string) {
    const res = await apiClient.post<Envelope<CommunityVideoEventRegistration>>(
      `/community/video-events/${eventId}/register`,
    )
    return unwrap(res.data)
  },

  async cancelVideoEventRegistration(eventId: string) {
    const res = await apiClient.post<Envelope<CommunityVideoEventRegistration>>(
      `/community/video-events/${eventId}/cancel-registration`,
    )
    return unwrap(res.data)
  },

  async joinVideoEvent(eventId: string) {
    const res = await apiClient.post<Envelope<CommunityVideoJoinPayload>>(`/community/video-events/${eventId}/join`)
    return unwrap(res.data)
  },

  async listVideoEventMessages(params: { eventId: string; page: number; limit: number; q?: string }) {
    const res = await apiClient.get<Envelope<PaginatedResult<CommunityMessage>>>(
      `/community/video-events/${params.eventId}/messages`,
      { params: { page: params.page, limit: params.limit, q: params.q } },
    )
    return unwrap(res.data)
  },

  async sendVideoEventMessage(params: { eventId: string; content?: string; imageUrl?: string; replyToMessageId?: string }) {
    const res = await apiClient.post<Envelope<{ message: CommunityMessage; moderation?: unknown; memberRole?: string }>>(
      `/community/video-events/${params.eventId}/messages`,
      {
        content: params.content,
        imageUrl: params.imageUrl,
        replyToMessageId: params.replyToMessageId,
      },
    )
    return unwrap(res.data)
  },

  async getLiveKitDiagnostics() {
    const res = await apiClient.get<Envelope<CommunityLiveKitDiagnostics>>('/community/video-events/livekit/diagnostics')
    return unwrap(res.data)
  },
}

export default communityService

export const adminCommunityService = {
  async listRooms(params?: {
    visibility?: 'public' | 'private'
    status?: 'active' | 'archived'
    diseaseKey?: string
    search?: string
  }) {
    const res = await apiClient.get<Envelope<CommunityRoom[]>>('/admin/community/rooms', { params })
    return unwrap(res.data)
  },

  async createRoom(data: {
    name: string
    slug?: string
    visibility: 'public' | 'private'
    topicLabel?: string
    description?: string
    guidelines?: string[]
    pinnedMessage?: string
    featured?: boolean
  }) {
    const res = await apiClient.post<Envelope<CommunityRoom>>('/admin/community/rooms', data)
    return unwrap(res.data)
  },

  async updateRoom(
    roomId: string,
    data: {
      name?: string
      slug?: string
      visibility?: 'public' | 'private'
      topicLabel?: string
      description?: string
      guidelines?: string[]
      pinnedMessage?: string
      featured?: boolean
    },
  ) {
    const res = await apiClient.patch<Envelope<CommunityRoom>>(`/admin/community/rooms/${roomId}`, data)
    return unwrap(res.data)
  },

  async archiveRoom(roomId: string) {
    const res = await apiClient.patch<Envelope<CommunityRoom>>(`/admin/community/rooms/${roomId}/archive`)
    return unwrap(res.data)
  },

  async unarchiveRoom(roomId: string) {
    const res = await apiClient.patch<Envelope<CommunityRoom>>(`/admin/community/rooms/${roomId}/unarchive`)
    return unwrap(res.data)
  },

  async listMembers(params: { roomId: string; page: number; limit: number; status?: string }) {
    const res = await apiClient.get<Envelope<PaginatedResult<CommunityMember>>>(
      `/admin/community/rooms/${params.roomId}/members`,
      { params: { page: params.page, limit: params.limit, status: params.status } },
    )
    return unwrap(res.data)
  },

  async updateMember(
    roomId: string,
    userId: string,
    data: { status?: string; role?: string; mutedUntil?: string | null },
  ) {
    const res = await apiClient.patch<Envelope<CommunityMember>>(
      `/admin/community/rooms/${roomId}/members/${userId}`,
      data,
    )
    return unwrap(res.data)
  },

  async inviteMember(roomId: string, data: { userId?: string; email?: string }) {
    const res = await apiClient.post<Envelope<{ roomId: string; userId: string; status: string }>>(
      `/admin/community/rooms/${roomId}/invite`,
      data,
    )
    return unwrap(res.data)
  },

  async listThreads(params: {
    roomId: string
    page: number
    limit: number
    q?: string
    prefix?: CommunityThreadPrefix | 'all'
    sort?: 'latest' | 'newest' | 'hot' | 'unanswered'
  }) {
    const res = await apiClient.get<Envelope<PaginatedResult<CommunityThread>>>(
      `/admin/community/rooms/${params.roomId}/threads`,
      {
        params: {
          page: params.page,
          limit: params.limit,
          q: params.q || undefined,
          prefix: params.prefix && params.prefix !== 'all' ? params.prefix : undefined,
          sort: params.sort,
        },
      },
    )
    return unwrap(res.data)
  },

  async updateThread(
    threadId: string,
    data: {
      sticky?: boolean
      locked?: boolean
      status?: 'open' | 'answered' | 'hidden' | 'deleted'
      acceptedReplyId?: string | null
      videoMeeting?: Partial<CommunityThreadVideoMeeting> | null
    },
  ) {
    const res = await apiClient.patch<Envelope<CommunityThread>>(`/admin/community/threads/${threadId}`, data)
    return unwrap(res.data)
  },

  async listVideoEvents(params?: {
    roomId?: string
    status?: string
    search?: string
    page?: number
    limit?: number
    sort?: 'scheduled_asc' | 'created_desc'
  }) {
    const res = await apiClient.get<Envelope<PaginatedResult<CommunityVideoEvent>>>('/admin/community/video-events', {
      params,
    })
    return unwrap(res.data)
  },

  async createVideoEvent(
    data: Partial<CommunityVideoEvent> & {
      roomId: string
      title: string
      scheduledStartAt: string
      scheduledEndAt: string
    },
  ) {
    const res = await apiClient.post<Envelope<CommunityVideoEvent>>('/admin/community/video-events', data)
    return unwrap(res.data)
  },

  async updateVideoEvent(eventId: string, data: Partial<CommunityVideoEvent>) {
    const res = await apiClient.patch<Envelope<CommunityVideoEvent>>(`/admin/community/video-events/${eventId}`, data)
    return unwrap(res.data)
  },

  async cancelVideoEvent(eventId: string) {
    const res = await apiClient.post<Envelope<CommunityVideoEvent>>(`/admin/community/video-events/${eventId}/cancel`)
    return unwrap(res.data)
  },

  async listVideoEventRegistrations(params: { eventId: string; page?: number; limit?: number; status?: string }) {
    const res = await apiClient.get<Envelope<PaginatedResult<CommunityVideoEventRegistration>>>(
      `/admin/community/video-events/${params.eventId}/registrations`,
      { params: { page: params.page || 1, limit: params.limit || 20, status: params.status } },
    )
    return unwrap(res.data)
  },

  async updateVideoEventRegistration(
    eventId: string,
    userId: string,
    data: { status?: string; removeReason?: string },
  ) {
    const res = await apiClient.patch<Envelope<CommunityVideoEventRegistration>>(
      `/admin/community/video-events/${eventId}/registrations/${userId}`,
      data,
    )
    return unwrap(res.data)
  },

  async listVideoEventParticipants(eventId: string) {
    const res = await apiClient.get<Envelope<CommunityVideoEventLiveParticipantsPayload>>(
      `/admin/community/video-events/${eventId}/participants`,
    )
    return unwrap(res.data)
  },

  async muteVideoEventParticipant(eventId: string, userId: string) {
    const res = await apiClient.post<Envelope<CommunityVideoEventModerationActionPayload>>(
      `/admin/community/video-events/${eventId}/participants/${userId}/mute`,
    )
    return unwrap(res.data)
  },

  async unmuteVideoEventParticipant(eventId: string, userId: string) {
    const res = await apiClient.post<Envelope<CommunityVideoEventModerationActionPayload>>(
      `/admin/community/video-events/${eventId}/participants/${userId}/unmute`,
    )
    return unwrap(res.data)
  },

  async disableVideoEventParticipantCamera(eventId: string, userId: string) {
    const res = await apiClient.post<Envelope<CommunityVideoEventModerationActionPayload>>(
      `/admin/community/video-events/${eventId}/participants/${userId}/disable-camera`,
    )
    return unwrap(res.data)
  },

  async enableVideoEventParticipantCamera(eventId: string, userId: string) {
    const res = await apiClient.post<Envelope<CommunityVideoEventModerationActionPayload>>(
      `/admin/community/video-events/${eventId}/participants/${userId}/enable-camera`,
    )
    return unwrap(res.data)
  },

  async disableVideoEventParticipantScreenShare(eventId: string, userId: string) {
    const res = await apiClient.post<Envelope<CommunityVideoEventModerationActionPayload>>(
      `/admin/community/video-events/${eventId}/participants/${userId}/disable-screen-share`,
    )
    return unwrap(res.data)
  },

  async enableVideoEventParticipantScreenShare(eventId: string, userId: string) {
    const res = await apiClient.post<Envelope<CommunityVideoEventModerationActionPayload>>(
      `/admin/community/video-events/${eventId}/participants/${userId}/enable-screen-share`,
    )
    return unwrap(res.data)
  },

  async kickVideoEventParticipant(eventId: string, userId: string) {
    const res = await apiClient.post<Envelope<CommunityVideoEventModerationActionPayload>>(
      `/admin/community/video-events/${eventId}/participants/${userId}/kick`,
    )
    return unwrap(res.data)
  },

  async banVideoEventParticipant(eventId: string, userId: string) {
    const res = await apiClient.post<Envelope<CommunityVideoEventModerationActionPayload>>(
      `/admin/community/video-events/${eventId}/participants/${userId}/ban`,
    )
    return unwrap(res.data)
  },
}
