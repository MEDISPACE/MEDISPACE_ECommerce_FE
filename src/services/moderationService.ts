import apiClient from '~/services/apiClient'
import type {
  AiModerationJob,
  AiModerationJobStatus,
  ModerationAction,
  ModerationActionLog,
  ModerationAppeal,
  ModerationAppealType,
  ModerationQueueItem,
  ModerationSeverity,
  ModerationTrigger,
} from '~/types/moderation'

type Envelope<T> = { message?: string; data?: T; result?: T }

function unwrap<T>(envelope: Envelope<T>): T {
  if (envelope.data !== undefined) return envelope.data
  if (envelope.result !== undefined) return envelope.result
  throw new Error('Unexpected API response shape')
}

export const moderationService = {
  async getQueue(params: {
    page: number
    limit: number
    severity?: ModerationSeverity
    trigger?: ModerationTrigger
    search?: string
  }) {
    const res = await apiClient.get<Envelope<{ items: ModerationQueueItem[]; page: number; limit: number; total: number }>>(
      '/admin/moderation/queue',
      { params },
    )
    return unwrap(res.data)
  },

  async getAiJobs(params: {
    page: number
    limit: number
    status?: AiModerationJobStatus
    roomId?: string
    messageId?: string
    search?: string
  }) {
    const res = await apiClient.get<
      Envelope<{ items: AiModerationJob[]; page: number; limit: number; total: number }>
    >('/admin/moderation/ai-jobs', { params })
    return unwrap(res.data)
  },

  async retryAiJob(jobId: string) {
    const res = await apiClient.post<Envelope<any>>(`/admin/moderation/ai-jobs/${jobId}/retry`)
    return unwrap(res.data)
  },

  async takeAction(params: {
    messageId: string
    action: ModerationAction
    notes?: string
    durationMinutes?: number
    targetUserId?: string
  }) {
    const res = await apiClient.patch<Envelope<any>>(`/admin/moderation/messages/${params.messageId}/action`, {
      action: params.action,
      notes: params.notes,
      durationMinutes: params.durationMinutes,
      targetUserId: params.targetUserId,
    })
    return unwrap(res.data)
  },

  async rerunAiReview(messageId: string) {
    const res = await apiClient.post<Envelope<any>>(`/admin/moderation/messages/${messageId}/ai-review`)
    return unwrap(res.data)
  },

  async getActions(params: {
    page: number
    limit: number
    roomId?: string
    messageId?: string
    targetUserId?: string
    action?: string
    dateFrom?: string
    dateTo?: string
  }) {
    const res = await apiClient.get<
      Envelope<{ items: ModerationActionLog[]; page: number; limit: number; total: number }>
    >('/admin/moderation/actions', { params })
    return unwrap(res.data)
  },

  async getAppeals(params: {
    page: number
    limit: number
    status?: 'open' | 'approved' | 'rejected'
    type?: ModerationAppealType
    roomId?: string
    userId?: string
    search?: string
  }) {
    const res = await apiClient.get<
      Envelope<{ items: ModerationAppeal[]; page: number; limit: number; total: number }>
    >('/admin/moderation/appeals', { params })
    return unwrap(res.data)
  },

  async resolveAppeal(params: { appealId: string; decision: 'approved' | 'rejected'; notes?: string }) {
    const res = await apiClient.patch<Envelope<ModerationAppeal>>(`/admin/moderation/appeals/${params.appealId}`, {
      decision: params.decision,
      notes: params.notes,
    })
    return unwrap(res.data)
  },
}

export default moderationService
