import { expect, test } from '@playwright/test'
import { users } from './fixtures/users'
import { API_URL, APP_URL, pageForRole, testId } from './helpers/auth'
import { listQuestions, setupLiveRegisteredEvent, setupScheduledEvent, submitQuestion } from './helpers/event'

test.describe('Community Video Events - Q&A system', () => {
  test('registered user in live event submits multiple questions', async ({ request }) => {
    const { admin, registeredUser } = users()
    const { event } = await setupLiveRegisteredEvent(request, admin, registeredUser)

    const first = await submitQuestion(request, registeredUser, event._id, `First question ${Date.now()}`)
    const second = await submitQuestion(request, registeredUser, event._id, `Second question ${Date.now()}`)
    expect(first.question.status).toMatch(/pending|hidden/)
    expect(second.question.status).toMatch(/pending|hidden/)

    const questions = await listQuestions(request, registeredUser, event._id)
    expect(questions.length).toBeGreaterThanOrEqual(2)
  })

  test('Q&A panel shows character counter and pending state', async ({ browser }) => {
    const { context, page } = await pageForRole(browser, 'registeredUser')
    await page.goto(`${APP_URL}/community/video-events/mock-live-event`)
    await expect(testId(page, 'qa-panel')).toBeVisible()
    await testId(page, 'question-input').fill('How should patients prepare for this medication?')
    await expect(testId(page, 'question-character-count')).toBeVisible()
    await testId(page, 'submit-question-btn').click()
    await expect(testId(page, 'question-status-pending')).toBeVisible()
    await context.close()
  })

  test('empty, whitespace, and over-limit questions are blocked', async ({ request }) => {
    const { admin, registeredUser } = users()
    const { event } = await setupLiveRegisteredEvent(request, admin, registeredUser)

    await submitQuestion(request, registeredUser, event._id, '', 422)
    await submitQuestion(request, registeredUser, event._id, '   ', 422)
    await submitQuestion(request, registeredUser, event._id, 'x'.repeat(2100), 422)
  })

  test('question submission during non-live scheduled event is allowed for pre-event Q&A', async ({ request }) => {
    const { admin, registeredUser } = users()
    const { event } = await setupScheduledEvent(request, admin)
    const result = await submitQuestion(request, registeredUser, event._id, `Pre-event question ${Date.now()}`)
    expect(result.question.status).toMatch(/pending|hidden/)
  })

  test('rapid question submissions remain bounded by API validation/rate limits', async ({ request }) => {
    const { admin, registeredUser } = users()
    const { event } = await setupLiveRegisteredEvent(request, admin, registeredUser)

    const responses = await Promise.all(
      Array.from({ length: 10 }, (_, index) =>
        request.post(`${API_URL}/community/video-events/${event._id}/questions`, {
          headers: { Authorization: `Bearer ${registeredUser.token}` },
          data: { content: `Rapid question ${index} ${Date.now()}` },
        }),
      ),
    )

    expect(responses.every((response) => [201, 429].includes(response.status()))).toBeTruthy()
  })

  test('visibility rules: pending hidden from others, approved visible, answered marked', async ({ request }) => {
    const { admin, registeredUser, host } = users()
    const { event } = await setupLiveRegisteredEvent(request, admin, registeredUser)
    const submitted = await submitQuestion(request, registeredUser, event._id, `Visibility question ${Date.now()}`)

    const otherViewBefore = await listQuestions(request, host, event._id)
    expect(otherViewBefore.find((q: any) => q._id === submitted.question._id)).toBeFalsy()

    await request.patch(`${API_URL}/admin/community/video-events/${event._id}/questions/${submitted.question._id}`, {
      headers: { Authorization: `Bearer ${admin.token}` },
      data: { status: 'approved' },
    })
    const otherViewAfter = await listQuestions(request, host, event._id)
    expect(otherViewAfter.find((q: any) => q._id === submitted.question._id)).toBeTruthy()

    await request.patch(`${API_URL}/admin/community/video-events/${event._id}/questions/${submitted.question._id}`, {
      headers: { Authorization: `Bearer ${admin.token}` },
      data: { status: 'answered', answerSummary: 'Answered during live session.' },
    })
    const answered = await listQuestions(request, host, event._id)
    expect(answered.find((q: any) => q._id === submitted.question._id)?.status).toBe('answered')
  })
})
