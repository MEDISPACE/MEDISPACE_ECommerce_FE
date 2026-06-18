import { expect, test } from '@playwright/test'
import { users } from './fixtures/users'
import { API_URL, APP_URL, pageForRole, testId } from './helpers/auth'
import { cancelEvent, createVideoEvent, endEvent, registerForEvent, setupScheduledEvent, startEvent } from './helpers/event'

test.describe('Community Video Events - lifecycle', () => {
  test('draft can be published by admin through update endpoint', async ({ request }) => {
    const { admin } = users()
    const room = await import('./helpers/event').then((h) => h.createCommunityRoom(request, admin))
    const draft = await createVideoEvent(request, admin, room._id, { status: 'draft' })
    expect(draft.status).toBe('draft')

    const response = await request.patch(`${API_URL}/admin/community/video-events/${draft._id}`, {
      headers: { Authorization: `Bearer ${admin.token}` },
      data: { status: 'scheduled' },
    })
    expect(response.ok()).toBeTruthy()
    expect(JSON.stringify(await response.json())).toContain('scheduled')
  })

  test('scheduled event starts live and registered user can see join control', async ({ browser, request }) => {
    const { admin, registeredUser } = users()
    const { event } = await setupScheduledEvent(request, admin)
    await registerForEvent(request, registeredUser, event._id)
    const live = await startEvent(request, admin, event._id)
    expect(live.status).toBe('live')

    const { context, page } = await pageForRole(browser, 'registeredUser')
    await page.goto(`${APP_URL}/community/video-events/${event._id}`)
    await expect(testId(page, 'join-event-btn')).toBeVisible()
    await context.close()
  })

  test('live event ends and cannot be joined after ending', async ({ request }) => {
    const { admin, registeredUser } = users()
    const { event } = await setupScheduledEvent(request, admin)
    await registerForEvent(request, registeredUser, event._id)
    await startEvent(request, admin, event._id)
    const ended = await endEvent(request, admin, event._id)
    expect(ended.status).toBe('ended')

    const join = await request.post(`${API_URL}/community/video-events/${event._id}/join`, {
      headers: { Authorization: `Bearer ${registeredUser.token}` },
      data: {},
    })
    expect(join.status()).toBeGreaterThanOrEqual(400)
  })

  test('scheduled event can be cancelled before starting', async ({ request }) => {
    const { admin, registeredUser } = users()
    const { event } = await setupScheduledEvent(request, admin)
    await registerForEvent(request, registeredUser, event._id)
    const cancelled = await cancelEvent(request, admin, event._id)
    expect(cancelled.status).toBe('cancelled')
  })

  test('wrong transitions and non-admin lifecycle actions are blocked', async ({ request }) => {
    const { admin, registeredUser } = users()
    const { event } = await setupScheduledEvent(request, admin)
    await startEvent(request, admin, event._id)

    const startAgain = await request.post(`${API_URL}/admin/community/video-events/${event._id}/start`, {
      headers: { Authorization: `Bearer ${admin.token}` },
      data: {},
    })
    expect(startAgain.status()).toBe(400)

    const userEnd = await request.post(`${API_URL}/admin/community/video-events/${event._id}/end`, {
      headers: { Authorization: `Bearer ${registeredUser.token}` },
      data: {},
    })
    expect([401, 403]).toContain(userEnd.status())
  })
})
