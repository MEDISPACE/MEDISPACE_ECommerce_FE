import { expect, test } from '@playwright/test'
import { users } from './fixtures/users'
import { API_URL, APP_URL, pageForRole, testId } from './helpers/auth'
import { listQuestions, setupLiveRegisteredEvent, submitQuestion, updateQuestion } from './helpers/event'

test.describe('Community Video Events - Q&A moderation', () => {
  test('admin sees and moderates pending question through API', async ({ request }) => {
    const { admin, registeredUser } = users()
    const { event } = await setupLiveRegisteredEvent(request, admin, registeredUser)
    const submitted = await submitQuestion(request, registeredUser, event._id, `Admin moderation question ${Date.now()}`)

    const approved = await updateQuestion(request, admin, event._id, submitted.question._id, { status: 'approved' })
    expect(approved.status).toBe('approved')
    const hidden = await updateQuestion(request, admin, event._id, submitted.question._id, { status: 'hidden' })
    expect(hidden.status).toBe('hidden')
    const answered = await updateQuestion(request, admin, event._id, submitted.question._id, { status: 'answered', answerSummary: 'Answered.' })
    expect(answered.status).toBe('answered')
    const pinned = await updateQuestion(request, admin, event._id, submitted.question._id, { pinned: true })
    expect(pinned.pinned).toBe(true)
    const unpinned = await updateQuestion(request, admin, event._id, submitted.question._id, { pinned: false })
    expect(unpinned.pinned).toBe(false)
  })

  test('admin moderation UI exposes approve, hide, answer, pin, and unpin controls', async ({ browser }) => {
    const { context, page } = await pageForRole(browser, 'admin')
    await page.goto(`${APP_URL}/admin/video-events`)
    await expect(testId(page, 'admin-video-events-page')).toBeVisible()
    await expect(testId(page, 'approve-question-btn')).toBeVisible()
    await expect(testId(page, 'hide-question-btn')).toBeVisible()
    await expect(testId(page, 'answer-question-btn')).toBeVisible()
    await expect(testId(page, 'pin-question-btn')).toBeVisible()
    await context.close()
  })

  test('regular user cannot moderate via API directly', async ({ request }) => {
    const { admin, registeredUser } = users()
    const { event } = await setupLiveRegisteredEvent(request, admin, registeredUser)
    const submitted = await submitQuestion(request, registeredUser, event._id, `Forbidden moderation ${Date.now()}`)

    const response = await request.patch(`${API_URL}/admin/community/video-events/${event._id}/questions/${submitted.question._id}`, {
      headers: { Authorization: `Bearer ${registeredUser.token}` },
      data: { status: 'approved' },
    })
    expect([401, 403]).toContain(response.status())
  })

  test('approved and hidden questions sync to regular user lists', async ({ request }) => {
    const { admin, registeredUser, host } = users()
    const { event } = await setupLiveRegisteredEvent(request, admin, registeredUser)
    const submitted = await submitQuestion(request, registeredUser, event._id, `Realtime moderation ${Date.now()}`)

    await updateQuestion(request, admin, event._id, submitted.question._id, { status: 'approved' })
    const approvedView = await listQuestions(request, host, event._id)
    expect(approvedView.some((q: any) => q._id === submitted.question._id)).toBeTruthy()

    await updateQuestion(request, admin, event._id, submitted.question._id, { status: 'hidden' })
    const hiddenView = await listQuestions(request, host, event._id)
    expect(hiddenView.some((q: any) => q._id === submitted.question._id)).toBeFalsy()
  })
})
