/**
 * community-ai-moderation.spec.ts
 *
 * End-to-end tests for AI Moderation:
 *   - Manual AI review → job succeeds, auto-hides high confidence content
 *   - [ai-review] content → queued finding, shouldHide=false
 *   - Safe content → job succeeds, applied.queued=false
 *   - Admin retries a job → status resets to pending
 *   - Admin filters AI jobs by status
 *
 * Requires: backend running with AI_MODERATION_MOCK=true AI_MODERATION_ENABLED=true
 * Set E2E_AI_MODERATION=true to run.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { expect, test, type APIRequestContext, type Browser } from '@playwright/test'
import {
  API_URL,
  APP_URL,
  AUTH_DIR,
  type Session,
  auth,
  createRoom,
  getAiJobs,
  getModerationQueue,
  joinRoom,
  newAuthedPage,
  pickData,
  rerunAiReview,
  retryAiJob,
  sendMessage,
  sessions,
  waitFor,
} from './community/helpers'

const AI_ENABLED = !!process.env.E2E_AI_MODERATION

test.describe.serial('community AI moderation e2e', () => {
  test.skip(!AI_ENABLED, 'Set E2E_AI_MODERATION=true and run backend with AI_MODERATION_MOCK=true')

  // ── [ai-hide] → auto-hide + admin audit UI ─────────────────────────────────

  test('manual AI review creates a succeeded job, hides unsafe content, and appears in admin audit UI', async ({
    browser,
    request,
  }) => {
    const { admin, customer } = sessions()
    const room = await createRoom(request, admin, 'public', 'E2E AI Hide')
    await joinRoom(request, customer, room._id)

    const marker = `AI_E2E_HIDE_${Date.now()}`
    const content = `[ai-hide] ${marker} unsafe medication advice`
    const sent = await sendMessage(request, customer, room._id, content)
    const messageId = sent?.message?._id
    expect(messageId).toBeTruthy()

    await rerunAiReview(request, admin, messageId)

    const job = await waitFor(
      () => getAiJobs(request, admin, { messageId }).then((d: any) => d.items?.[0]),
      (item: any) => item?.status === 'succeeded',
    )
    expect(job).toMatchObject({
      status: 'succeeded',
      aiResult: { severity: 'high', suggestedAction: 'hide' },
    })
    expect(job.applied?.autoHidden).toBe(true)

    const finding = await waitFor(
      () =>
        getModerationQueue(request, admin, { trigger: 'ai', search: marker }).then(
          (d: any) => d.items?.[0],
        ),
      (item: any) => item?.trigger === 'ai' && item?.severity === 'high',
    )
    expect(finding).toMatchObject({ trigger: 'ai', severity: 'high', status: 'open' })

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

  // ── [ai-review] → queued finding, message stays visible ───────────────────

  test('[ai-review] content → job succeeded, shouldHide=false, finding queued with trigger=ai', async ({
    request,
  }) => {
    const { admin, customer } = sessions()
    const room = await createRoom(request, admin, 'public', 'E2E AI Review')
    await joinRoom(request, customer, room._id)

    const marker = `AI_E2E_REVIEW_${Date.now()}`
    const content = `[ai-review] ${marker} possibly misleading`
    const sent = await sendMessage(request, customer, room._id, content)
    const messageId = sent?.message?._id
    expect(messageId).toBeTruthy()

    await rerunAiReview(request, admin, messageId)

    const job = await waitFor(
      () => getAiJobs(request, admin, { messageId }).then((d: any) => d.items?.[0]),
      (item: any) => item?.status === 'succeeded',
    )
    expect(job.status).toBe('succeeded')
    expect(job.aiResult?.shouldHide).toBe(false)
    expect(job.aiResult?.suggestedAction).toBe('review')
    expect(job.aiResult?.severity).toBe('medium')

    // applied.autoHidden must be false – message still visible
    expect(job.applied?.autoHidden).toBe(false)
    expect(job.applied?.queued).toBe(true)

    // Finding should exist with trigger=ai
    const finding = await waitFor(
      () =>
        getModerationQueue(request, admin, { trigger: 'ai', search: marker }).then(
          (d: any) => d.items?.[0],
        ),
      (item: any) => item?.trigger === 'ai',
    )
    expect(finding?.severity).toBe('medium')
    expect(finding?.status).toBe('open')
  })

  // ── Safe content → job succeeds, no finding created ───────────────────────

  test('safe content → job succeeded, applied.queued=false, no finding in queue', async ({
    request,
  }) => {
    const { admin, customer } = sessions()
    const room = await createRoom(request, admin, 'public', 'E2E AI Safe')
    await joinRoom(request, customer, room._id)

    const marker = `AI_E2E_SAFE_${Date.now()}`
    const content = `Safe health question: ${marker} how to stay healthy?`
    const sent = await sendMessage(request, customer, room._id, content)
    const messageId = sent?.message?._id
    expect(messageId).toBeTruthy()

    await rerunAiReview(request, admin, messageId)

    const job = await waitFor(
      () => getAiJobs(request, admin, { messageId }).then((d: any) => d.items?.[0]),
      (item: any) => item?.status === 'succeeded',
    )
    expect(job.status).toBe('succeeded')
    expect(job.aiResult?.severity).toBe('low')
    expect(job.applied?.queued).toBe(false)
    expect(job.applied?.autoHidden).toBe(false)

    // No finding in moderation queue for this message
    const queue = await getModerationQueue(request, admin, { search: marker })
    expect(queue.items.find((f: any) => f.messageId === messageId)).toBeUndefined()
  })

  // ── Retry failed job ───────────────────────────────────────────────────────

  test('admin can retry a job – status resets to pending', async ({ request }) => {
    const { admin, customer } = sessions()
    const room = await createRoom(request, admin, 'public', 'E2E AI Retry')
    await joinRoom(request, customer, room._id)

    // Use [ai-hide] so a job is created
    const content = `[ai-hide] retry test ${Date.now()}`
    const sent = await sendMessage(request, customer, room._id, content)
    const messageId = sent?.message?._id

    await rerunAiReview(request, admin, messageId)

    // Wait for job to finish
    const job = await waitFor(
      () => getAiJobs(request, admin, { messageId }).then((d: any) => d.items?.[0]),
      (item: any) => item?.status === 'succeeded' || item?.status === 'failed',
    )
    expect(job._id).toBeTruthy()

    // Retry the job
    const retried = await retryAiJob(request, admin, job._id)
    expect(retried.status).toBe('pending')

    // Confirm job went back to pending then succeeded
    const afterRetry = await waitFor(
      () => getAiJobs(request, admin, { messageId }).then((d: any) => d.items?.[0]),
      (item: any) => item?.status === 'succeeded' || item?.status === 'failed',
    )
    expect(['succeeded', 'failed']).toContain(afterRetry.status)
  })

  // ── Filter AI jobs by status ───────────────────────────────────────────────

  test('admin can filter AI jobs by status=succeeded', async ({ request }) => {
    const { admin } = sessions()
    const result = await getAiJobs(request, admin, { status: 'succeeded' })
    expect(result.items.every((j: any) => j.status === 'succeeded')).toBe(true)
  })

  test('admin can filter AI jobs by status=failed', async ({ request }) => {
    const { admin } = sessions()
    const result = await getAiJobs(request, admin, { status: 'failed' })
    // May be empty but all items must be failed
    expect(result.items.every((j: any) => j.status === 'failed')).toBe(true)
  })

  test('admin can filter AI jobs by status=pending', async ({ request }) => {
    const { admin } = sessions()
    const result = await getAiJobs(request, admin, { status: 'pending' })
    expect(result.items.every((j: any) => j.status === 'pending')).toBe(true)
  })

  test('retry non-existent job returns 404', async ({ request }) => {
    const { admin } = sessions()
    const fakeJobId = '000000000000000000000001'
    const res = await request.post(`${API_URL}/admin/moderation/ai-jobs/${fakeJobId}/retry`, {
      headers: auth(admin.token),
      data: {},
    })
    expect(res.status()).toBe(404)
  })
})
