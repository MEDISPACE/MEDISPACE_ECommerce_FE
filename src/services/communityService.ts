import apiClient from '~/services/apiClient'
import type { CommunityRoom, CommunityMessage, CommunityMember, PaginatedResult } from '~/types/community'

type Envelope<T> = { message?: string; data?: T; result?: T }

function unwrap<T>(envelope: Envelope<T>): T {
  if (envelope.data !== undefined) return envelope.data
  if (envelope.result !== undefined) return envelope.result
  throw new Error('Unexpected API response shape')
}

export const communityService = {
  async listRooms(params?: { visibility?: 'public' | 'private'; diseaseKey?: string }) {
    const res = await apiClient.get<Envelope<CommunityRoom[]>>('/community/rooms', { params })
    return unwrap(res.data)
  },

  async listMyRooms(params?: { visibility?: 'public' | 'private'; diseaseKey?: string }) {
    const res = await apiClient.get<Envelope<CommunityRoom[]>>('/community/rooms/my', { params })
    return unwrap(res.data)
  },

  async joinRoom(roomId: string) {
    const res = await apiClient.post<Envelope<{ roomId: string; userId: string; status: string }>>(
      `/community/rooms/${roomId}/join`,
    )
    return unwrap(res.data)
  },

  async requestJoin(roomId: string) {
    const res = await apiClient.post<Envelope<{ roomId: string; userId: string; status: string }>>(
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

  async listMessages(params: { roomId: string; page: number; limit: number }) {
    const res = await apiClient.get<Envelope<PaginatedResult<CommunityMessage>>>(
      `/community/rooms/${params.roomId}/messages`,
      { params: { page: params.page, limit: params.limit } },
    )
    return unwrap(res.data)
  },

  async sendMessage(params: { roomId: string; content: string }) {
    const res = await apiClient.post<
      Envelope<{ message: CommunityMessage; moderation: any; memberRole?: string }>
    >(`/community/rooms/${params.roomId}/messages`, { content: params.content })
    return unwrap(res.data)
  },

  async reportMessage(params: { messageId: string; reason?: string }) {
    const res = await apiClient.post<Envelope<any>>(`/community/messages/${params.messageId}/report`, {
      reason: params.reason,
    })
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
}

export default communityService

export const adminCommunityService = {
  async listRooms(params?: { visibility?: 'public' | 'private'; status?: 'active' | 'archived'; diseaseKey?: string }) {
    const res = await apiClient.get<Envelope<CommunityRoom[]>>('/admin/community/rooms', { params })
    return unwrap(res.data)
  },

  async createRoom(data: { name: string; slug?: string; visibility: 'public' | 'private'; diseaseKey?: string }) {
    const res = await apiClient.post<Envelope<CommunityRoom>>('/admin/community/rooms', data)
    return unwrap(res.data)
  },

  async updateRoom(
    roomId: string,
    data: { name?: string; slug?: string; visibility?: 'public' | 'private'; diseaseKey?: string },
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
}
