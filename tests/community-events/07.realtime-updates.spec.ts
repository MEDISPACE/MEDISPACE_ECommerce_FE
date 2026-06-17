import { expect, test } from '@playwright/test'
import { users } from './fixtures/users'
import { APP_URL, pageForRole, testId } from './helpers/auth'
import { registerForEvent, setupScheduledEvent, startEvent, endEvent, submitQuestion, updateQuestion } from './helpers/event'

test.describe('Community Video Events - realtime updates', () => {
  test('admin starts event and registered user sees join button in real time', async ({ browser, request }) => {
    const { admin, registeredUser } = users()
    const { event } = await setupScheduledEvent(request, admin)
    await registerForEvent(request, registeredUser, event._id)

    const adminPage = await pageForRole(browser, 'admin')
    const userPage = await pageForRole(browser, 'registeredUser')
    await userPage.page.goto(`${APP_URL}/community/video-events/${event._id}`)
    await adminPage.page.goto(`${APP_URL}/admin/video-events`)

    await startEvent(request, admin, event._id)
    await expect(testId(userPage.page, 'join-event-btn')).toBeVisible({ timeout: 5_000 })
    await expect(testId(userPage.page, 'event-live-notification')).toBeVisible({ timeout: 5_000 })
    await adminPage.context.close()
    await userPage.context.close()
  })

  test('approved question appears and hidden question disappears without refresh', async ({ browser, request }) => {
    const { admin, registeredUser } = users()
    const { event } = await setupScheduledEvent(request, admin)
    await registerForEvent(request, registeredUser, event._id)
    await startEvent(request, admin, event._id)
    const submitted = await submitQuestion(request, registeredUser, event._id, `Realtime approved ${Date.now()}`)

    const userPage = await pageForRole(browser, 'registeredUser')
    await userPage.page.goto(`${APP_URL}/community/video-events/${event._id}`)
    await updateQuestion(request, admin, event._id, submitted.question._id, { status: 'approved' })
    await expect(testId(userPage.page, `question-${submitted.question._id}`)).toBeVisible({ timeout: 5_000 })

    await updateQuestion(request, admin, event._id, submitted.question._id, { status: 'hidden' })
    await expect(testId(userPage.page, `question-${submitted.question._id}`)).toBeHidden({ timeout: 5_000 })
    await userPage.context.close()
  })

  test('event ended closes video room in registered user page', async ({ browser, request }) => {
    const { admin, registeredUser } = users()
    const { event } = await setupScheduledEvent(request, admin)
    await registerForEvent(request, registeredUser, event._id)
    await startEvent(request, admin, event._id)

    const userPage = await pageForRole(browser, 'registeredUser')
    await userPage.page.goto(`${APP_URL}/community/video-events/${event._id}`)
    await endEvent(request, admin, event._id)
    await expect(testId(userPage.page, 'session-ended-message')).toBeVisible({ timeout: 5_000 })
    await expect(testId(userPage.page, 'video-room')).toBeHidden({ timeout: 5_000 })
    await userPage.context.close()
  })

  test('attendee count updates when another user registers', async ({ browser, request }) => {
    const { admin, registeredUser, host } = users()
    const { event } = await setupScheduledEvent(request, admin, { capacity: 10 })
    const pageB = await pageForRole(browser, 'registeredUser')
    await pageB.page.goto(`${APP_URL}/community/video-events/${event._id}`)
    await registerForEvent(request, host, event._id)
    await expect(testId(pageB.page, 'attendee-count')).toContainText('1', { timeout: 5_000 })
    await registerForEvent(request, registeredUser, event._id)
    await expect(testId(pageB.page, 'attendee-count')).toContainText('2', { timeout: 5_000 })
    await pageB.context.close()
  })
})
