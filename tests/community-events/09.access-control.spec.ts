import { expect, test } from '@playwright/test'
import { eventPayload } from './fixtures/events'
import { authHeader, users, type TestUser } from './fixtures/users'
import { API_URL } from './helpers/auth'
import { createCommunityRoom, joinCommunityRoom, registerForEvent, setupLiveRegisteredEvent, setupScheduledEvent } from './helpers/event'

test.describe('Community Video Events - access control', () => {
  test('endpoint role matrix is enforced', async ({ request }) => {
    const { admin, registeredUser, host, guest } = users()
    const room = await createCommunityRoom(request, admin)
    const eventSetup = await setupScheduledEvent(request, admin)
    await registerForEvent(request, registeredUser, eventSetup.event._id)
    const live = await setupLiveRegisteredEvent(request, admin, registeredUser)
    await joinCommunityRoom(request, registeredUser, live.room._id)

    const cases: Array<{ name: string; method: 'get' | 'post' | 'patch'; url: string; actor: TestUser; data?: Record<string, unknown>; ok: number[]; denied: number[] }> = [
      { name: 'POST event admin', method: 'post', url: '/admin/community/video-events', actor: admin, data: { roomId: room._id, ...eventPayload() }, ok: [201], denied: [] },
      { name: 'POST event user denied', method: 'post', url: '/admin/community/video-events', actor: registeredUser, data: { roomId: room._id, ...eventPayload() }, ok: [], denied: [401, 403] },
      { name: 'PUT event admin', method: 'patch', url: `/admin/community/video-events/${eventSetup.event._id}`, actor: admin, data: { title: `ACL update ${Date.now()}` }, ok: [200], denied: [] },
      { name: 'PUT event user denied', method: 'patch', url: `/admin/community/video-events/${eventSetup.event._id}`, actor: registeredUser, data: { title: 'denied' }, ok: [], denied: [401, 403] },
      { name: 'start user denied', method: 'post', url: `/admin/community/video-events/${eventSetup.event._id}/start`, actor: registeredUser, data: {}, ok: [], denied: [401, 403] },
      { name: 'join registered ok', method: 'post', url: `/community/video-events/${live.event._id}/join`, actor: registeredUser, data: {}, ok: [200], denied: [] },
      { name: 'join guest denied', method: 'post', url: `/community/video-events/${live.event._id}/join`, actor: guest, data: {}, ok: [], denied: [401] },
      { name: 'meeting chat registered ok', method: 'post', url: `/community/rooms/${live.room._id}/messages`, actor: registeredUser, data: { content: `ACL chat ${Date.now()}` }, ok: [201], denied: [] },
      { name: 'meeting chat guest denied', method: 'post', url: `/community/rooms/${live.room._id}/messages`, actor: guest, data: { content: 'denied' }, ok: [], denied: [401] },
    ]

    for (const item of cases) {
      const response = await request[item.method](`${API_URL}${item.url}`, { headers: authHeader(item.actor), data: item.data || {} })
      const expected = item.ok.length ? item.ok : item.denied
      expect(expected, item.name).toContain(response.status())
    }
  })

  test('unauthenticated admin endpoints return 401', async ({ request }) => {
    const { admin } = users()
    const { event } = await setupScheduledEvent(request, admin)
    const endpoints = [
      ['post', '/admin/community/video-events'],
      ['patch', `/admin/community/video-events/${event._id}`],
      ['post', `/admin/community/video-events/${event._id}/start`],
      ['post', `/admin/community/video-events/${event._id}/end`],
    ] as const

    for (const [method, url] of endpoints) {
      const response = await request[method](`${API_URL}${url}`, { data: {} })
      expect(response.status()).toBe(401)
    }
  })

  test('user cannot access token without registration', async ({ request }) => {
    const { admin, host } = users()
    const { event } = await setupScheduledEvent(request, admin)
    await request.post(`${API_URL}/admin/community/video-events/${event._id}/start`, { headers: authHeader(admin), data: {} })
    const response = await request.post(`${API_URL}/community/video-events/${event._id}/join`, {
      headers: authHeader(host),
      data: {},
    })
    expect(response.status()).toBe(403)
  })
})
