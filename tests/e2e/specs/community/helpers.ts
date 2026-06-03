/**
 * helpers.ts – Shared utilities for Community & Moderation E2E tests
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { type APIRequestContext, type Browser, expect } from '@playwright/test'

export const APP_URL = process.env.E2E_BASE_URL || 'http://localhost:3000'
export const API_URL = process.env.E2E_API_URL || 'http://localhost:8000'
export const AUTH_DIR = path.resolve('tests/e2e/.auth')

// ── Types ─────────────────────────────────────────────────────────────────────

export type Session = {
  token: string
  user: { _id: string; email: string }
}

export type Sessions = {
  admin: Session
  customer: Session
  customer2: Session
}

// ── Session helpers ──────────────────────────────────────────────────────────

export function sessions(): Sessions {
  return JSON.parse(readFileSync(path.join(AUTH_DIR, 'sessions.json'), 'utf8')) as Sessions
}

export function auth(token: string) {
  return { Authorization: `Bearer ${token}` }
}

export function pickData(payload: any): any {
  if (payload?.data !== undefined) return payload.data
  if (payload?.result !== undefined) return payload.result
  return payload
}

export async function newAuthedPage(browser: Browser, stateName: string) {
  const context = await browser.newContext({ storageState: path.join(AUTH_DIR, stateName) })
  const page = await context.newPage()
  return { context, page }
}

// ── Polling helper ───────────────────────────────────────────────────────────

export async function waitFor<T>(
  read: () => Promise<T>,
  accept: (value: T) => boolean,
  timeoutMs = 30_000,
): Promise<T> {
  const startedAt = Date.now()
  let latest: T
  do {
    latest = await read()
    if (accept(latest)) return latest
    await new Promise((resolve) => setTimeout(resolve, 500))
  } while (Date.now() - startedAt < timeoutMs)
  return latest!
}

// ── Room helpers ─────────────────────────────────────────────────────────────

export function roomMeta(prefix: string) {
  const stamp = `${Date.now()}-${Math.floor(Math.random() * 10000)}`
  return {
    name: `${prefix} ${stamp}`,
    slug: `${prefix.toLowerCase().replace(/\s+/g, '-')}-${stamp}`,
  }
}

export async function createRoom(
  api: APIRequestContext,
  admin: Session,
  visibility: 'public' | 'private',
  prefix = 'E2E Community',
  extraData: Record<string, unknown> = {},
) {
  const meta = roomMeta(prefix)
  const res = await api.post(`${API_URL}/admin/community/rooms`, {
    headers: auth(admin.token),
    data: { ...meta, visibility, diseaseKey: 'e2e', ...extraData },
  })
  expect(res.ok(), `createRoom failed: ${res.status()}`).toBeTruthy()
  const room = pickData(await res.json())
  expect(room._id).toBeTruthy()
  return room as { _id: string; name: string; slug: string; status: string }
}

export async function updateRoom(
  api: APIRequestContext,
  admin: Session,
  roomId: string,
  data: Record<string, unknown>,
) {
  const res = await api.patch(`${API_URL}/admin/community/rooms/${roomId}`, {
    headers: auth(admin.token),
    data,
  })
  expect(res.ok(), `updateRoom failed: ${res.status()}`).toBeTruthy()
  return pickData(await res.json())
}

export async function archiveRoom(api: APIRequestContext, admin: Session, roomId: string) {
  const res = await api.patch(`${API_URL}/admin/community/rooms/${roomId}/archive`, {
    headers: auth(admin.token),
    data: {},
  })
  expect(res.ok(), `archiveRoom failed: ${res.status()}`).toBeTruthy()
  return pickData(await res.json())
}

export async function unarchiveRoom(api: APIRequestContext, admin: Session, roomId: string) {
  const res = await api.patch(`${API_URL}/admin/community/rooms/${roomId}/unarchive`, {
    headers: auth(admin.token),
    data: {},
  })
  expect(res.ok(), `unarchiveRoom failed: ${res.status()}`).toBeTruthy()
  return pickData(await res.json())
}

export async function listAdminRooms(
  api: APIRequestContext,
  admin: Session,
  params: Record<string, string | number> = {},
) {
  const res = await api.get(`${API_URL}/admin/community/rooms`, {
    headers: auth(admin.token),
    params: { page: 1, limit: 50, ...params },
  })
  expect(res.ok()).toBeTruthy()
  return pickData(await res.json()) as any[]
}

export async function listPublicRooms(api: APIRequestContext) {
  const res = await api.get(`${API_URL}/community/rooms`)
  expect(res.ok()).toBeTruthy()
  return pickData(await res.json()) as any[]
}

// ── Member helpers ────────────────────────────────────────────────────────────

export async function joinRoom(api: APIRequestContext, session: Session, roomId: string) {
  const res = await api.post(`${API_URL}/community/rooms/${roomId}/join`, {
    headers: auth(session.token),
    data: {},
  })
  expect(res.ok(), `joinRoom failed: ${res.status()}`).toBeTruthy()
  return pickData(await res.json())
}

export async function requestJoin(api: APIRequestContext, session: Session, roomId: string) {
  const res = await api.post(`${API_URL}/community/rooms/${roomId}/join-request`, {
    headers: auth(session.token),
    data: {},
  })
  expect(res.ok(), `requestJoin failed: ${res.status()}`).toBeTruthy()
  return pickData(await res.json())
}

export async function leaveRoom(api: APIRequestContext, session: Session, roomId: string) {
  const res = await api.post(`${API_URL}/community/rooms/${roomId}/leave`, {
    headers: auth(session.token),
    data: {},
  })
  expect(res.ok(), `leaveRoom failed: ${res.status()}`).toBeTruthy()
  return pickData(await res.json())
}

export async function inviteMember(
  api: APIRequestContext,
  admin: Session,
  roomId: string,
  data: { userId?: string; email?: string },
) {
  const res = await api.post(`${API_URL}/admin/community/rooms/${roomId}/invite`, {
    headers: auth(admin.token),
    data,
  })
  expect(res.ok(), `inviteMember failed: ${res.status()}`).toBeTruthy()
  return pickData(await res.json())
}

export async function listMembers(
  api: APIRequestContext,
  admin: Session,
  roomId: string,
  params: Record<string, string | number> = {},
) {
  const res = await api.get(`${API_URL}/admin/community/rooms/${roomId}/members`, {
    headers: auth(admin.token),
    params: { page: 1, limit: 50, ...params },
  })
  expect(res.ok()).toBeTruthy()
  return pickData(await res.json()).items as any[]
}

export async function updateMember(
  api: APIRequestContext,
  admin: Session,
  roomId: string,
  userId: string,
  data: Record<string, unknown>,
) {
  const res = await api.patch(`${API_URL}/admin/community/rooms/${roomId}/members/${userId}`, {
    headers: auth(admin.token),
    data,
  })
  expect(res.ok(), `updateMember failed: ${res.status()}`).toBeTruthy()
  return pickData(await res.json())
}

// ── Message helpers ───────────────────────────────────────────────────────────

export async function sendMessage(
  api: APIRequestContext,
  session: Session,
  roomId: string,
  content: string,
) {
  const res = await api.post(`${API_URL}/community/rooms/${roomId}/messages`, {
    headers: auth(session.token),
    data: { content },
  })
  expect(res.ok(), `sendMessage failed: ${res.status()}`).toBeTruthy()
  return pickData(await res.json())
}

export async function tryRawSendMessage(
  api: APIRequestContext,
  session: Session,
  roomId: string,
  content: string,
) {
  return api.post(`${API_URL}/community/rooms/${roomId}/messages`, {
    headers: auth(session.token),
    data: { content },
  })
}

export async function listMessages(
  api: APIRequestContext,
  session: Session,
  roomId: string,
  params: Record<string, string | number> = {},
) {
  const res = await api.get(`${API_URL}/community/rooms/${roomId}/messages`, {
    headers: auth(session.token),
    params: { page: 1, limit: 20, ...params },
  })
  expect(res.ok()).toBeTruthy()
  return pickData(await res.json())
}

export async function markRoomRead(api: APIRequestContext, session: Session, roomId: string) {
  const res = await api.post(`${API_URL}/community/rooms/${roomId}/read`, {
    headers: auth(session.token),
    data: {},
  })
  expect(res.ok()).toBeTruthy()
  return pickData(await res.json())
}

// ── Report helpers ───────────────────────────────────────────────────────────

export async function reportMessage(
  api: APIRequestContext,
  session: Session,
  messageId: string,
  reason = 'E2E test report',
) {
  const res = await api.post(`${API_URL}/community/messages/${messageId}/report`, {
    headers: auth(session.token),
    data: { reason },
  })
  expect(res.ok(), `reportMessage failed: ${res.status()}`).toBeTruthy()
  return pickData(await res.json())
}

// ── Moderation helpers ────────────────────────────────────────────────────────

export async function getModerationQueue(
  api: APIRequestContext,
  admin: Session,
  params: Record<string, string | number> = {},
) {
  const res = await api.get(`${API_URL}/admin/moderation/queue`, {
    headers: auth(admin.token),
    params: { page: 1, limit: 20, ...params },
  })
  expect(res.ok()).toBeTruthy()
  return pickData(await res.json())
}

export async function getModerationActions(
  api: APIRequestContext,
  admin: Session,
  params: Record<string, string | number> = {},
) {
  const res = await api.get(`${API_URL}/admin/moderation/actions`, {
    headers: auth(admin.token),
    params: { page: 1, limit: 20, ...params },
  })
  expect(res.ok()).toBeTruthy()
  return pickData(await res.json())
}

export async function takeModerationAction(
  api: APIRequestContext,
  admin: Session,
  messageId: string,
  action: string,
  extra: Record<string, unknown> = {},
) {
  const res = await api.patch(`${API_URL}/admin/moderation/messages/${messageId}/action`, {
    headers: auth(admin.token),
    data: { action, notes: 'E2E moderation action', ...extra },
  })
  expect(res.ok(), `takeModerationAction(${action}) failed: ${res.status()}`).toBeTruthy()
  return pickData(await res.json())
}

// ── Appeal helpers ────────────────────────────────────────────────────────────

export async function createAppeal(
  api: APIRequestContext,
  session: Session,
  roomId: string,
  type: 'ban' | 'mute' | 'message',
  extra: Record<string, unknown> = {},
) {
  const res = await api.post(`${API_URL}/community/rooms/${roomId}/appeals`, {
    headers: auth(session.token),
    data: {
      type,
      reason: `E2E appeal reason ${Date.now()} – please review`,
      ...extra,
    },
  })
  expect(res.ok(), `createAppeal(${type}) failed: ${res.status()}`).toBeTruthy()
  return pickData(await res.json())
}

export async function getAppeals(
  api: APIRequestContext,
  admin: Session,
  params: Record<string, string | number> = {},
) {
  const res = await api.get(`${API_URL}/admin/moderation/appeals`, {
    headers: auth(admin.token),
    params: { page: 1, limit: 20, ...params },
  })
  expect(res.ok()).toBeTruthy()
  return pickData(await res.json())
}

export async function resolveAppeal(
  api: APIRequestContext,
  admin: Session,
  appealId: string,
  decision: 'approved' | 'rejected',
  notes = 'E2E decision',
) {
  const res = await api.patch(`${API_URL}/admin/moderation/appeals/${appealId}`, {
    headers: auth(admin.token),
    data: { decision, notes },
  })
  expect(res.ok(), `resolveAppeal(${decision}) failed: ${res.status()}`).toBeTruthy()
  return pickData(await res.json())
}

// ── AI Moderation helpers ─────────────────────────────────────────────────────

export async function rerunAiReview(api: APIRequestContext, admin: Session, messageId: string) {
  const res = await api.post(`${API_URL}/admin/moderation/messages/${messageId}/ai-review`, {
    headers: auth(admin.token),
    data: {},
  })
  expect(res.ok(), `rerunAiReview failed: ${res.status()}`).toBeTruthy()
  return pickData(await res.json())
}

export async function getAiJobs(
  api: APIRequestContext,
  admin: Session,
  params: Record<string, string | number> = {},
) {
  const res = await api.get(`${API_URL}/admin/moderation/ai-jobs`, {
    headers: auth(admin.token),
    params: { page: 1, limit: 10, ...params },
  })
  expect(res.ok()).toBeTruthy()
  return pickData(await res.json())
}

export async function retryAiJob(api: APIRequestContext, admin: Session, jobId: string) {
  const res = await api.post(`${API_URL}/admin/moderation/ai-jobs/${jobId}/retry`, {
    headers: auth(admin.token),
    data: {},
  })
  expect(res.ok(), `retryAiJob failed: ${res.status()}`).toBeTruthy()
  return pickData(await res.json())
}
