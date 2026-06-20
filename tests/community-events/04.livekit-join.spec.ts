import { expect, test } from '@playwright/test'
import { users } from './fixtures/users'
import { API_URL, APP_URL, pageForRole, testId } from './helpers/auth'
import { joinEvent, registerForEvent, setupScheduledEvent, startEvent, endEvent } from './helpers/event'

async function mockLiveEventDetail(page: any, eventId = 'mock-event') {
  const event = {
    _id: eventId,
    roomId: 'mock-room',
    title: 'Mock live event',
    description: 'Mock event for browser join flow.',
    agenda: 'Live discussion',
    visibility: 'public',
    status: 'live',
    scheduledStartAt: new Date(Date.now() - 60000).toISOString(),
    scheduledEndAt: new Date(Date.now() + 3600000).toISOString(),
    registrationCount: 1,
    capacity: 50,
    viewerRegistration: null,
    room: { _id: 'mock-room', name: 'Mock room', slug: 'mock-room', visibility: 'public' },
  }
  await page.route(`**/community/video-events/${eventId}`, (route: any) => {
    if (route.request().resourceType() === 'document') return route.continue()
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: event }) })
  })
  await page.route('**/community/rooms/mock-room/join', (route: any) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: { roomId: 'mock-room', userId: 'mock-user', status: 'active' } }) }))
  await page.route('**/community/rooms/mock-room/messages**', (route: any) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: { items: [], page: 1, limit: 80, total: 0 } }) }))
}

test.describe('Community Video Events - LiveKit join', () => {
  test('authenticated user joins live event by link and receives backend token payload', async ({ request }) => {
    const { admin, registeredUser } = users()
    const { event } = await setupScheduledEvent(request, admin)
    await startEvent(request, admin, event._id)
    const payload = await joinEvent(request, registeredUser, event._id)

    expect(payload.provider).toBe('livekit')
    expect(payload.token).toBeTruthy()
    expect(payload.wsUrl).toBeTruthy()
    expect(payload.role).toBe('attendee')
  })

  test('LiveKit UI uses mocked token response and renders room controls', async ({ browser }) => {
    const { context, page } = await pageForRole(browser, 'registeredUser')
    await mockLiveEventDetail(page)
    await page.route('**/community/video-events/*/join', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { eventId: 'mock-event', provider: 'livekit', wsUrl: 'wss://mock-livekit.local', token: 'mock-livekit-token', role: 'attendee', expiresAt: new Date(Date.now() + 3600000).toISOString() } }),
      })
    })

    await page.goto(`${APP_URL}/community/video-events/mock-event`)
    await testId(page, 'medical-disclaimer-checkbox').check()
    await testId(page, 'join-event-btn').click()
    await expect(testId(page, 'video-room')).toBeVisible()
    await expect(page.locator('.lk-chat-toggle')).toHaveCount(0)
    await context.close()
  })

  test('non-live event, ended event, and unauthenticated user are blocked', async ({ request }) => {
    const { admin, registeredUser, host } = users()
    const scheduled = await setupScheduledEvent(request, admin)
    await registerForEvent(request, registeredUser, scheduled.event._id)

    await joinEvent(request, registeredUser, scheduled.event._id, 400)

    const live = await setupScheduledEvent(request, admin)
    await startEvent(request, admin, live.event._id)
    await joinEvent(request, host, live.event._id)

    const ended = await setupScheduledEvent(request, admin)
    await registerForEvent(request, registeredUser, ended.event._id)
    await startEvent(request, admin, ended.event._id)
    await endEvent(request, admin, ended.event._id)
    await joinEvent(request, registeredUser, ended.event._id, 400)

    const unauthenticated = await request.post(`${API_URL}/community/video-events/${live.event._id}/join`, { data: {} })
    expect(unauthenticated.status()).toBe(401)
  })

  test('meeting renders one MediSpace chat panel and no LiveKit chat panel', async ({ browser }) => {
    const { context, page } = await pageForRole(browser, 'registeredUser')
    await mockLiveEventDetail(page)
    await page.route('**/community/video-events/*/join', (route) => route.fulfill({ status: 200, body: JSON.stringify({ data: { token: 'mock', wsUrl: 'wss://mock', provider: 'livekit', role: 'attendee', expiresAt: new Date().toISOString() } }) }))
    await page.goto(`${APP_URL}/community/video-events/mock-event`)
    await testId(page, 'medical-disclaimer-checkbox').check()
    await testId(page, 'join-event-btn').click()
    await expect(testId(page, 'video-room')).toBeVisible()
    await expect(page.getByText('Chat cuộc họp')).toBeVisible()
    await expect(page.locator('.lk-chat')).toHaveCount(0)
    await context.close()
  })
})
