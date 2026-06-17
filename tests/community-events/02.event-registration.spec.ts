import { expect, test } from '@playwright/test'
import { users } from './fixtures/users'
import { API_URL, APP_URL, pageForRole, testId } from './helpers/auth'
import {
  cancelEvent,
  cancelRegistration,
  createVideoEvent,
  endEvent,
  registerForEvent,
  setupScheduledEvent,
  startEvent,
} from './helpers/event'

test.describe('Community Video Events - registration', () => {
  test('guest sees listing and unauthenticated register redirects to login', async ({ browser }) => {
    const { context, page } = await pageForRole(browser, 'guest')
    await page.goto(`${APP_URL}/community/video-events`)
    await expect(testId(page, 'video-events-list')).toBeVisible()
    await testId(page, 'register-event-btn').first().click()
    await expect(page).toHaveURL(/login/)
    await context.close()
  })

  test('user registers, sees registered state, and event appears in my events API', async ({ request }) => {
    const { admin, registeredUser } = users()
    const { event } = await setupScheduledEvent(request, admin)

    const registration = await registerForEvent(request, registeredUser, event._id)
    expect(registration.status).toBe('registered')

    const myEvents = await request.get(`${API_URL}/community/video-events/my`, {
      headers: { Authorization: `Bearer ${registeredUser.token}` },
    })
    expect(myEvents.ok()).toBeTruthy()
    expect(JSON.stringify(await myEvents.json())).toContain(event._id)
  })

  test('register twice is idempotent and returns active registration', async ({ request }) => {
    const { admin, registeredUser } = users()
    const { event } = await setupScheduledEvent(request, admin)

    await registerForEvent(request, registeredUser, event._id)
    const second = await registerForEvent(request, registeredUser, event._id)
    expect(second.status).toMatch(/registered|attended/)
  })

  test('full event blocks additional registration', async ({ request }) => {
    const { admin, registeredUser, host } = users()
    const room = await import('./helpers/event').then((h) => h.createCommunityRoom(request, admin))
    const event = await createVideoEvent(request, admin, room._id, { capacity: 1 })
    await registerForEvent(request, registeredUser, event._id)
    await registerForEvent(request, host, event._id, 409)
  })

  test('cancelled and ended events block registration', async ({ request }) => {
    const { admin, registeredUser } = users()
    const cancelledSetup = await setupScheduledEvent(request, admin)
    await cancelEvent(request, admin, cancelledSetup.event._id)
    await registerForEvent(request, registeredUser, cancelledSetup.event._id, 400)

    const endedSetup = await setupScheduledEvent(request, admin)
    await startEvent(request, admin, endedSetup.event._id)
    await endEvent(request, admin, endedSetup.event._id)
    await registerForEvent(request, registeredUser, endedSetup.event._id, 400)
  })

  test('registered user cancels registration and can re-register', async ({ request }) => {
    const { admin, registeredUser } = users()
    const { event } = await setupScheduledEvent(request, admin, { capacity: 2 })

    await registerForEvent(request, registeredUser, event._id)
    const cancelled = await cancelRegistration(request, registeredUser, event._id)
    expect(cancelled.status).toBe('cancelled')
    const again = await registerForEvent(request, registeredUser, event._id)
    expect(again.status).toBe('registered')
  })
})
