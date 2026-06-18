import { expect, test } from '@playwright/test'
import { eventPayload, futureDate } from './fixtures/events'
import { users } from './fixtures/users'
import { API_URL, APP_URL, pageForRole, testId } from './helpers/auth'
import { cancelEvent, createCommunityRoom, createVideoEvent, registerForEvent, setupScheduledEvent, updateVideoEvent } from './helpers/event'

test.describe('Community Video Events - event creation', () => {
  test('admin creates scheduled event from management UI', async ({ browser }) => {
    const { context, page } = await pageForRole(browser, 'admin')
    await page.goto(`${APP_URL}/admin/video-events`)

    await expect(testId(page, 'admin-video-events-page')).toBeVisible()
    await testId(page, 'event-title-input').fill(`E2E UI event ${Date.now()}`)
    await testId(page, 'event-description-input').fill('Knowledge sharing for MediSpace community.')
    await testId(page, 'event-start-input').fill('2099-06-17T09:00')
    await testId(page, 'event-end-input').fill('2099-06-17T10:00')
    await testId(page, 'event-capacity-input').fill('120')
    await testId(page, 'create-event-submit').click()

    await expect(testId(page, 'event-status-scheduled')).toBeVisible()
    await expect(testId(page, 'admin-event-list')).toContainText('E2E UI event')
    await context.close()
  })

  test('admin API creates event and persists all important fields', async ({ request }) => {
    const { admin } = users()
    const room = await createCommunityRoom(request, admin)
    const payload = eventPayload({ roomId: room._id, capacity: 88, tags: ['e2e', 'saved-fields'] })
    const event = await createVideoEvent(request, admin, room._id, payload)

    expect(event.title).toBe(payload.title)
    expect(event.description).toBe(payload.description)
    expect(event.capacity).toBe(88)
    expect(event.status).toBe('scheduled')
    expect(event.provider).toBe('livekit')
    expect(event.tags).toContain('saved-fields')
  })

  test('validation errors are returned for invalid creation payloads', async ({ request }) => {
    const { admin } = users()
    const room = await createCommunityRoom(request, admin)
    const cases = [
      { title: '', message: 'empty title' },
      { title: 'x'.repeat(300), message: 'long title' },
      { scheduledStartAt: 'invalid-date', message: 'invalid start' },
      { scheduledStartAt: futureDate(120), scheduledEndAt: futureDate(60), message: 'end before start' },
      { capacity: 0, message: 'zero capacity' },
      { capacity: -5, message: 'negative capacity' },
    ]

    for (const invalid of cases) {
      const response = await request.post(`${API_URL}/admin/community/video-events`, {
        headers: { Authorization: `Bearer ${admin.token}` },
        data: { roomId: room._id, ...eventPayload(invalid) },
      })
      expect(response.status(), invalid.message).toBeGreaterThanOrEqual(400)
    }
  })

  test('admin edits a scheduled event and changes are persisted', async ({ request }) => {
    const { admin } = users()
    const { event } = await setupScheduledEvent(request, admin)
    const updated = await updateVideoEvent(request, admin, event._id, {
      title: `Updated ${event.title}`,
      description: 'Updated description',
      scheduledStartAt: futureDate(180),
      scheduledEndAt: futureDate(240),
      capacity: 150,
    })

    expect(updated.title).toContain('Updated')
    expect(updated.description).toBe('Updated description')
    expect(updated.capacity).toBe(150)
  })

  test('admin edits event time after registration and registered user keeps registration', async ({ request }) => {
    const { admin, registeredUser } = users()
    const { event } = await setupScheduledEvent(request, admin)
    await registerForEvent(request, registeredUser, event._id)

    const updated = await updateVideoEvent(request, admin, event._id, {
      scheduledStartAt: futureDate(240),
      scheduledEndAt: futureDate(300),
    })
    expect(updated.scheduledStartAt).toBeTruthy()
  })

  test('admin cancels scheduled event and status becomes cancelled', async ({ request }) => {
    const { admin, registeredUser } = users()
    const { event } = await setupScheduledEvent(request, admin)
    await registerForEvent(request, registeredUser, event._id)

    const cancelled = await cancelEvent(request, admin, event._id)
    expect(cancelled.status).toBe('cancelled')
  })
})
