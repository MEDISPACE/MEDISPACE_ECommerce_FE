import { expect, test } from '@playwright/test'
import { authHeader, users } from './fixtures/users'
import { API_URL } from './helpers/auth'
import { setupLiveRegisteredEvent } from './helpers/event'

test.describe('Community Video Events - no separate Q&A surface', () => {
  test('public video event question endpoints are not exposed', async ({ request }) => {
    const { admin, registeredUser } = users()
    const { event } = await setupLiveRegisteredEvent(request, admin, registeredUser)

    const createResponse = await request.post(`${API_URL}/community/video-events/${event._id}/questions`, {
      headers: authHeader(registeredUser),
      data: { content: `This should use meeting chat ${Date.now()}` },
    })
    const listResponse = await request.get(`${API_URL}/community/video-events/${event._id}/questions`, {
      headers: authHeader(registeredUser),
    })

    expect(createResponse.status()).toBe(404)
    expect(listResponse.status()).toBe(404)
  })

  test('admin video event question moderation endpoints are not exposed', async ({ request }) => {
    const { admin, registeredUser } = users()
    const { event } = await setupLiveRegisteredEvent(request, admin, registeredUser)

    const response = await request.patch(`${API_URL}/admin/community/video-events/${event._id}/questions/507f1f77bcf86cd799439011`, {
      headers: authHeader(admin),
      data: { status: 'approved' },
    })

    expect(response.status()).toBe(404)
  })
})
