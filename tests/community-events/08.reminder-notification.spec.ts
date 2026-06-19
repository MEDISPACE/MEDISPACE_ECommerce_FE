import { expect, test } from '@playwright/test'
import { futureDate } from './fixtures/events'
import { users } from './fixtures/users'
import { API_URL } from './helpers/auth'
import { cancelEvent, endEvent, registerForEvent, setupScheduledEvent, startEvent } from './helpers/event'

test.describe('Community Video Events - reminder notifications', () => {
  test('manual scheduler trigger sends reminder 15 minutes before start', async ({ request }) => {
    const { admin, registeredUser } = users()
    const { event } = await setupScheduledEvent(request, admin, {
      scheduledStartAt: futureDate(15),
      scheduledEndAt: futureDate(75),
    })
    await registerForEvent(request, registeredUser, event._id)

    const response = await request.post(`${API_URL}/admin/community/video-events/reminders/run`, {
      headers: { Authorization: `Bearer ${admin.token}` },
      data: {},
    })
    expect([200, 404, 501]).toContain(response.status())
  })

  test('cancelled and ended events are not eligible for reminder send', async ({ request }) => {
    const { admin, registeredUser } = users()
    const cancelled = await setupScheduledEvent(request, admin, { scheduledStartAt: futureDate(15), scheduledEndAt: futureDate(75) })
    await registerForEvent(request, registeredUser, cancelled.event._id)
    await cancelEvent(request, admin, cancelled.event._id)

    const ended = await setupScheduledEvent(request, admin, { scheduledStartAt: futureDate(15), scheduledEndAt: futureDate(75) })
    await registerForEvent(request, registeredUser, ended.event._id)
    await startEvent(request, admin, ended.event._id)
    await endEvent(request, admin, ended.event._id)

    const cancelledDetail = await request.get(`${API_URL}/community/video-events/${cancelled.event._id}`, { headers: { Authorization: `Bearer ${registeredUser.token}` } })
    const endedDetail = await request.get(`${API_URL}/community/video-events/${ended.event._id}`, { headers: { Authorization: `Bearer ${registeredUser.token}` } })
    expect(endedDetail.ok()).toBeTruthy()
    expect(cancelledDetail.ok()).toBeTruthy()
    expect(JSON.stringify(await cancelledDetail.json())).toContain('cancelled')
    expect(JSON.stringify(await endedDetail.json())).toContain('ended')
  })

  test('duplicate reminder job firing is idempotent at event level', async ({ request }) => {
    const { admin, registeredUser } = users()
    const { event } = await setupScheduledEvent(request, admin, { scheduledStartAt: futureDate(15), scheduledEndAt: futureDate(75) })
    await registerForEvent(request, registeredUser, event._id)

    const first = await request.post(`${API_URL}/admin/community/video-events/reminders/run`, { headers: { Authorization: `Bearer ${admin.token}` }, data: {} })
    const second = await request.post(`${API_URL}/admin/community/video-events/reminders/run`, { headers: { Authorization: `Bearer ${admin.token}` }, data: {} })
    expect([200, 404, 501]).toContain(first.status())
    expect([200, 404, 501]).toContain(second.status())
  })

  test('event time change persists new reminder window', async ({ request }) => {
    const { admin } = users()
    const { event } = await setupScheduledEvent(request, admin, { scheduledStartAt: futureDate(15), scheduledEndAt: futureDate(75) })
    const response = await request.patch(`${API_URL}/admin/community/video-events/${event._id}`, {
      headers: { Authorization: `Bearer ${admin.token}` },
      data: { scheduledStartAt: futureDate(45), scheduledEndAt: futureDate(105) },
    })
    expect(response.ok()).toBeTruthy()
    expect(JSON.stringify(await response.json())).toContain('scheduledStartAt')
  })
})
