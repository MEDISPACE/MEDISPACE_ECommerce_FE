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

async function waitFor<T>(read: () => Promise<T>, accept: (value: T) => boolean, timeoutMs = 30_000) {
  const startedAt = Date.now()
  let latest: T

  do {
    latest = await read()
    if (accept(latest)) return latest
    await new Promise((resolve) => setTimeout(resolve, 500))
  } while (Date.now() - startedAt < timeoutMs)

  return latest!
}

function roomMeta(prefix: string) {
  const stamp = `${Date.now()}-${Math.floor(Math.random() * 10000)}`
  return {
    name: `${prefix} ${stamp}`,
    slug: `${prefix.toLowerCase().replace(/\s+/g, '-')}-${stamp}`,
  }
}

async function createRoom(api: APIRequestContext, admin: Session) {
  const res = await api.post(`${API_URL}/admin/community/rooms`, {
    headers: auth(admin.token),
    data: { ...roomMeta('E2E AI Moderation'), visibility: 'public', diseaseKey: 'e2e-ai' },
  })
  expect(res.ok()).toBeTruthy()
  return pickData(await res.json()) as { _id: string; name: string; slug: string }
}

async function joinRoom(api: APIRequestContext, session: Session, roomId: string) {
  const res = await api.post(`${API_URL}/community/rooms/${roomId}/join`, {
    headers: auth(session.token),
    data: {},
  })
  expect(res.ok()).toBeTruthy()
}

async function sendMessage(api: APIRequestContext, session: Session, roomId: string, content: string) {
  const res = await api.post(`${API_URL}/community/rooms/${roomId}/messages`, {
    headers: auth(session.token),
    data: { content },
  })
  expect(res.ok()).toBeTruthy()
  return pickData(await res.json())
}

async function rerunAiReview(api: APIRequestContext, admin: Session, messageId: string) {
  const res = await api.post(`${API_URL}/admin/moderation/messages/${messageId}/ai-review`, {
    headers: auth(admin.token),
    data: {},
  })
  expect(res.ok()).toBeTruthy()
  return pickData(await res.json())
}

async function getAiJob(api: APIRequestContext, admin: Session, messageId: string) {
  const res = await api.get(`${API_URL}/admin/moderation/ai-jobs`, {
    headers: auth(admin.token),
    params: { page: 1, limit: 5, messageId },
  })
  expect(res.ok()).toBeTruthy()
  const data = pickData(await res.json())
  return data.items?.[0]
}

async function getAiFinding(api: APIRequestContext, admin: Session, search: string) {
  const res = await api.get(`${API_URL}/admin/moderation/queue`, {
    headers: auth(admin.token),
    params: { page: 1, limit: 10, trigger: 'ai', search },
  })
  expect(res.ok()).toBeTruthy()
  const data = pickData(await res.json())
  return data.items?.[0]
}

async function newAuthedPage(browser: Browser, stateName: string) {
  const context = await browser.newContext({ storageState: path.join(AUTH_DIR, stateName) })
  const page = await context.newPage()
  return { context, page }
}

test.describe.serial('community AI moderation e2e', () => {
  test.skip(!process.env.E2E_AI_MODERATION, 'Set E2E_AI_MODERATION=true and run backend with AI_MODERATION_MOCK=true')

  test('manual AI review creates a succeeded job, hides unsafe content, and appears in admin audit UI', async ({
    browser,
    request,
  }) => {
    const { admin, customer } = sessions()
    const room = await createRoom(request, admin)
    await joinRoom(request, customer, room._id)

    const marker = `AI_E2E_HIDE_${Date.now()}`
    const content = `[ai-hide] ${marker} unsafe medication advice`
    const sent = await sendMessage(request, customer, room._id, content)
    const messageId = sent?.message?._id
    expect(messageId).toBeTruthy()

    await rerunAiReview(request, admin, messageId)

    const job = await waitFor(
      () => getAiJob(request, admin, messageId),
      (item) => item?.status === 'succeeded',
    )
    expect(job).toMatchObject({
      status: 'succeeded',
      aiResult: {
        severity: 'high',
        suggestedAction: 'hide',
      },
    })
    expect(job.applied?.autoHidden).toBe(true)

    const finding = await waitFor(
      () => getAiFinding(request, admin, marker),
      (item) => item?.trigger === 'ai' && item?.severity === 'high',
    )
    expect(finding).toMatchObject({
      trigger: 'ai',
      severity: 'high',
      status: 'open',
    })

    const { context, page } = await newAuthedPage(browser, 'admin.json')
    await page.goto(`${APP_URL}/admin/moderation`)
    await expect(page.getByText('AI moderation jobs')).toBeVisible()
    const messageIdInput = page.getByPlaceholder('messageId')
    await messageIdInput.fill(messageId)
    await expect(messageIdInput).toHaveValue(messageId)
    await page.waitForTimeout(250)
    const [jobsResponse] = await Promise.all([
      page.waitForResponse((resp) => resp.url().includes('/admin/moderation/ai-jobs')),
      page.getByRole('button', { name: 'Làm mới AI' }).click(),
    ])
    expect(jobsResponse.ok()).toBeTruthy()
    await expect(page.getByText(content).last()).toBeVisible()
    await expect(page.getByText('AI: high / 0.95 / hide')).toBeVisible()
    await context.close()
  })
})
