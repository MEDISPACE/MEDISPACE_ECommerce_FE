import { readFileSync } from 'node:fs'
import path from 'node:path'
import { expect, test, type APIRequestContext, type Browser } from '@playwright/test'

const APP_URL = process.env.E2E_BASE_URL || 'http://localhost:3000'
const API_URL = process.env.E2E_API_URL || 'http://localhost:8000'
const AUTH_DIR = path.resolve('tests/e2e/.auth')

type Session = {
  token: string
  user: { _id: string; email: string }
}

type Sessions = {
  admin: Session
  customer: Session
  customer2: Session
}

function sessions(): Sessions {
  return JSON.parse(readFileSync(path.join(AUTH_DIR, 'sessions.json'), 'utf8')) as Sessions
}

function pickData(payload: any) {
  if (payload?.data !== undefined) return payload.data
  if (payload?.result !== undefined) return payload.result
  return payload
}

function auth(token: string) {
  return { Authorization: `Bearer ${token}` }
}

function roomMeta(prefix: string) {
  const stamp = `${Date.now()}-${Math.floor(Math.random() * 10000)}`
  return {
    name: `${prefix} ${stamp}`,
    slug: `${prefix.toLowerCase().replace(/\s+/g, '-')}-${stamp}`,
  }
}

async function createRoom(
  api: APIRequestContext,
  admin: Session,
  visibility: 'public' | 'private',
  prefix = 'E2E Community',
) {
  const meta = roomMeta(prefix)
  const res = await api.post(`${API_URL}/admin/community/rooms`, {
    headers: auth(admin.token),
    data: { ...meta, visibility, diseaseKey: 'e2e' },
  })
  expect(res.ok()).toBeTruthy()
  const room = pickData(await res.json())
  expect(room._id).toBeTruthy()
  return room as { _id: string; name: string; slug: string }
}

async function joinRoom(api: APIRequestContext, session: Session, roomId: string) {
  const res = await api.post(`${API_URL}/community/rooms/${roomId}/join`, {
    headers: auth(session.token),
    data: {},
  })
  expect(res.ok()).toBeTruthy()
}

async function requestJoin(api: APIRequestContext, session: Session, roomId: string) {
  const res = await api.post(`${API_URL}/community/rooms/${roomId}/join-request`, {
    headers: auth(session.token),
    data: {},
  })
  expect(res.ok()).toBeTruthy()
  return pickData(await res.json())
}

async function listMembers(api: APIRequestContext, admin: Session, roomId: string) {
  const res = await api.get(`${API_URL}/admin/community/rooms/${roomId}/members`, {
    headers: auth(admin.token),
    params: { page: 1, limit: 50 },
  })
  expect(res.ok()).toBeTruthy()
  return pickData(await res.json()).items as any[]
}

async function updateMember(
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
  expect(res.ok()).toBeTruthy()
  return pickData(await res.json())
}

async function sendMessage(api: APIRequestContext, session: Session, roomId: string, content: string) {
  const res = await api.post(`${API_URL}/community/rooms/${roomId}/messages`, {
    headers: auth(session.token),
    data: { content },
  })
  expect(res.ok()).toBeTruthy()
  return pickData(await res.json())
}

async function takeModerationAction(
  api: APIRequestContext,
  admin: Session,
  messageId: string,
  action: string,
  targetUserId?: string,
) {
  const res = await api.patch(`${API_URL}/admin/moderation/messages/${messageId}/action`, {
    headers: auth(admin.token),
    data: { action, targetUserId, notes: 'E2E moderation action' },
  })
  expect(res.ok()).toBeTruthy()
  return pickData(await res.json())
}

async function createAppeal(api: APIRequestContext, session: Session, roomId: string, type: 'ban' | 'mute') {
  const res = await api.post(`${API_URL}/community/rooms/${roomId}/appeals`, {
    headers: auth(session.token),
    data: { type, reason: `E2E appeal reason ${Date.now()}` },
  })
  expect(res.ok()).toBeTruthy()
  return pickData(await res.json())
}

async function newAuthedPage(browser: Browser, stateName: string) {
  const context = await browser.newContext({ storageState: path.join(AUTH_DIR, stateName) })
  const page = await context.newPage()
  return { context, page }
}

test.describe.serial('community room, realtime, moderation and appeal', () => {
  test('private room request is approved through member management API', async ({ request }) => {
    const { admin, customer } = sessions()
    const room = await createRoom(request, admin, 'private', 'E2E Private')

    const joinRequest = await requestJoin(request, customer, room._id)
    expect(joinRequest.status).toBe('pending')

    let members = await listMembers(request, admin, room._id)
    const pending = members.find((member) => member.userId === customer.user._id)
    expect(pending?.status).toBe('pending')

    await updateMember(request, admin, room._id, customer.user._id, { status: 'active' })
    members = await listMembers(request, admin, room._id)
    const active = members.find((member) => member.userId === customer.user._id)
    expect(active?.status).toBe('active')
  })

  test('room list updates unread and message count from realtime events', async ({ browser, request }) => {
    const { admin, customer, customer2 } = sessions()
    const room = await createRoom(request, admin, 'public', 'E2E Realtime')
    await joinRoom(request, customer, room._id)
    await joinRoom(request, customer2, room._id)

    const { context, page } = await newAuthedPage(browser, 'customer.json')
    await page.goto(`${APP_URL}/community`)

    const roomCard = page.locator(`[data-testid="community-room-card"][data-room-id="${room._id}"]`)
    await expect(roomCard).toBeVisible()
    await expect(roomCard).toContainText('0 tin nhắn')
    await expect(roomCard).toHaveAttribute('data-realtime-joined', 'true')

    const content = `E2E realtime message ${Date.now()}`
    await sendMessage(request, customer2, room._id, content)

    await expect(roomCard).toContainText('1 tin nhắn')
    await expect(roomCard).toContainText('1 mới')

    await page.goto(`${APP_URL}/community/${room._id}`)
    await expect(page.getByText(content)).toBeVisible()
    await context.close()
  })

  test('moderation ban can be appealed and approved by admin', async ({ browser, request }) => {
    const { admin, customer } = sessions()
    const room = await createRoom(request, admin, 'public', 'E2E Appeal')
    await joinRoom(request, customer, room._id)

    const hiddenContent = `E2E hidden phone ${Date.now()} 0901234567`
    const sent = await sendMessage(request, customer, room._id, hiddenContent)
    const messageId = sent?.message?._id
    expect(messageId).toBeTruthy()
    expect(sent?.message?.status).toBe('hidden')

    await takeModerationAction(request, admin, messageId, 'ban_user', customer.user._id)
    let members = await listMembers(request, admin, room._id)
    expect(members.find((member) => member.userId === customer.user._id)?.status).toBe('banned')

    const appeal = await createAppeal(request, customer, room._id, 'ban')
    expect(appeal.status).toBe('open')

    const { context, page } = await newAuthedPage(browser, 'admin.json')
    await page.goto(`${APP_URL}/admin/moderation`)
    await expect(page.getByText('Appeal đang chờ xử lý')).toBeVisible()
    await expect(page.getByText(appeal.reason)).toBeVisible()

    const [resolveResp] = await Promise.all([
      page.waitForResponse((resp) => resp.url().includes(`/admin/moderation/appeals/${appeal._id}`)),
      page.locator('button').filter({ hasText: 'Chấp nhận' }).first().click(),
    ])
    expect(resolveResp.ok()).toBeTruthy()
    await expect(page.getByText(appeal.reason)).toHaveCount(0)
    await context.close()

    members = await listMembers(request, admin, room._id)
    expect(members.find((member) => member.userId === customer.user._id)?.status).toBe('left')
  })
})
