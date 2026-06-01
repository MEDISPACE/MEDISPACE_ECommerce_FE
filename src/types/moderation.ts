import type { CommunityUserSummary } from './community'

export type ModerationSeverity = 'low' | 'medium' | 'high' | 'critical'
export type ModerationTrigger = 'auto' | 'user_report' | 'ai'

export interface AiModerationResult {
  severity: ModerationSeverity
  categories: string[]
  confidence: number
  shouldHide: boolean
  requiresHumanReview: boolean
  reason: string
  suggestedAction: 'none' | 'review' | 'hide'
  model?: string
  promptVersion?: string
  reviewedAt?: string
  latencyMs?: number
}

export interface ModerationQueueItem {
  _id: string
  roomId: string
  messageId: string
  senderId: string
  room?: {
    name?: string
    slug?: string
    visibility?: string
    diseaseKey?: string
  }
  message?: {
    _id?: string
    content?: string
    senderId?: string
    status?: string
    createdAt?: string
  }
  severity?: ModerationSeverity
  categories?: string[]
  confidence?: 'low' | 'medium' | 'high' | number
  reasons?: string[]
  ai?: AiModerationResult
  trigger?: ModerationTrigger
  status?: 'open' | 'resolved'
  reportCount?: number
  createdAt?: string
  updatedAt?: string
}

export type ModerationAction =
  | 'approve'
  | 'hide'
  | 'delete'
  | 'mute_user'
  | 'ban_user'
  | 'unmute_user'
  | 'unban_user'
  | 'restore_message'
  | 'reopen_finding'

export interface ModerationActionLog {
  _id: string
  roomId: string
  messageId: string
  action: ModerationAction
  performedBy: string
  targetUserId?: string
  notes?: string
  durationMinutes?: number
  previousMessageStatus?: string
  createdAt: string
  performedByUser?: CommunityUserSummary
  targetUser?: CommunityUserSummary
}

export type ModerationAppealType = 'ban' | 'mute' | 'message'
export type ModerationAppealStatus = 'open' | 'approved' | 'rejected'

export interface ModerationAppeal {
  _id: string
  roomId: string
  userId: string
  messageId?: string
  type: ModerationAppealType
  reason: string
  status: ModerationAppealStatus
  decisionNotes?: string
  reviewedBy?: string
  reviewedAt?: string
  createdAt?: string
  updatedAt?: string
  user?: CommunityUserSummary
  room?: {
    _id?: string
    name?: string
    slug?: string
    visibility?: string
    diseaseKey?: string
  }
  message?: {
    _id?: string
    content?: string
    status?: string
    createdAt?: string
  }
}
