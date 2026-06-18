import { expect, type APIRequestContext } from '@playwright/test'
import { eventPayload } from '../fixtures/events'
import { authHeader, type TestUser } from '../fixtures/users'
import { API_URL } from './auth'

export function pickData(payload: any) {
  if (payload?.data !== undefined) return payload.data
  if (payload?.result !== undefined) return payload.result
  return payload
}

export async function createCommunityRoom(api: APIRequestContext, admin: TestUser, overrides: Record<string, unknown> = {}) {
  const stamp = `${Date.now()}-${Math.floor(Math.random() * 100000)}`
  const response = await api.post(`${API_URL}/admin/community/rooms`, {
    headers: authHeader(admin),
    data: {
      name: `E2E Video Room ${stamp}`,
      slug: `e2e-video-room-${stamp}`,
      visibility: 'public',
      diseaseKey: 'e2e-video',
      ...overrides,
    },
  })
  expect(response.ok(), `create room failed: ${response.status()} ${await response.text()}`).toBeTruthy()
  return pickData(await response.json())
}

export async function createVideoEvent(
  api: APIRequestContext,
  admin: TestUser,
  roomId: string,
  overrides: Record<string, unknown> = {},
) {
  const response = await api.post(`${API_URL}/admin/community/video-events`, {
    headers: authHeader(admin),
    data: { roomId, ...eventPayload(overrides) },
  })
  expect(response.ok(), `create event failed: ${response.status()} ${await response.text()}`).toBeTruthy()
  return pickData(await response.json())
}

export async function updateVideoEvent(
  api: APIRequestContext,
  admin: TestUser,
  eventId: string,
  data: Record<string, unknown>,
) {
  const response = await api.patch(`${API_URL}/admin/community/video-events/${eventId}`, {
    headers: authHeader(admin),
    data,
  })
  expect(response.ok(), `update event failed: ${response.status()} ${await response.text()}`).toBeTruthy()
  return pickData(await response.json())
}

export async function startEvent(api: APIRequestContext, admin: TestUser, eventId: string) {
  const response = await api.post(`${API_URL}/admin/community/video-events/${eventId}/start`, {
    headers: authHeader(admin),
    data: {},
  })
  expect(response.ok(), `start event failed: ${response.status()} ${await response.text()}`).toBeTruthy()
  return pickData(await response.json())
}

export async function endEvent(api: APIRequestContext, admin: TestUser, eventId: string) {
  const response = await api.post(`${API_URL}/admin/community/video-events/${eventId}/end`, {
    headers: authHeader(admin),
    data: {},
  })
  expect(response.ok(), `end event failed: ${response.status()} ${await response.text()}`).toBeTruthy()
  return pickData(await response.json())
}

export async function cancelEvent(api: APIRequestContext, admin: TestUser, eventId: string) {
  const response = await api.post(`${API_URL}/admin/community/video-events/${eventId}/cancel`, {
    headers: authHeader(admin),
    data: {},
  })
  expect(response.ok(), `cancel event failed: ${response.status()} ${await response.text()}`).toBeTruthy()
  return pickData(await response.json())
}

export async function registerForEvent(api: APIRequestContext, user: TestUser, eventId: string, expectedStatus = 201) {
  const response = await api.post(`${API_URL}/community/video-events/${eventId}/register`, {
    headers: authHeader(user),
    data: {},
  })
  expect(response.status(), `register response: ${await response.text()}`).toBe(expectedStatus)
  return response.ok() ? pickData(await response.json()) : response
}

export async function cancelRegistration(api: APIRequestContext, user: TestUser, eventId: string) {
  const response = await api.post(`${API_URL}/community/video-events/${eventId}/cancel-registration`, {
    headers: authHeader(user),
    data: {},
  })
  expect(response.ok(), `cancel registration failed: ${response.status()} ${await response.text()}`).toBeTruthy()
  return pickData(await response.json())
}

export async function joinEvent(api: APIRequestContext, user: TestUser, eventId: string, expectedStatus = 200) {
  const response = await api.post(`${API_URL}/community/video-events/${eventId}/join`, {
    headers: authHeader(user),
    data: {},
  })
  expect(response.status(), `join response: ${await response.text()}`).toBe(expectedStatus)
  return response.ok() ? pickData(await response.json()) : response
}

export async function joinCommunityRoom(api: APIRequestContext, user: TestUser, roomId: string, expectedStatus = 200) {
  const response = await api.post(`${API_URL}/community/rooms/${roomId}/join`, {
    headers: authHeader(user),
    data: {},
  })
  expect(response.status(), `join room response: ${await response.text()}`).toBe(expectedStatus)
  return response.ok() ? pickData(await response.json()) : response
}

export async function sendRoomMessage(api: APIRequestContext, user: TestUser, roomId: string, content: string, expectedStatus = 201) {
  const response = await api.post(`${API_URL}/community/rooms/${roomId}/messages`, {
    headers: authHeader(user),
    data: { content },
  })
  expect(response.status(), `send room message response: ${await response.text()}`).toBe(expectedStatus)
  return response.ok() ? pickData(await response.json()) : response
}

export async function listRoomMessages(api: APIRequestContext, user: TestUser, roomId: string) {
  const response = await api.get(`${API_URL}/community/rooms/${roomId}/messages`, {
    headers: authHeader(user),
    params: { page: 1, limit: 50 },
  })
  expect(response.ok(), `list room messages failed: ${response.status()} ${await response.text()}`).toBeTruthy()
  return pickData(await response.json()).items
}

export async function setupScheduledEvent(api: APIRequestContext, admin: TestUser, overrides: Record<string, unknown> = {}) {
  const room = await createCommunityRoom(api, admin)
  const event = await createVideoEvent(api, admin, room._id, overrides)
  return { room, event }
}

export async function setupLiveRegisteredEvent(api: APIRequestContext, admin: TestUser, user: TestUser) {
  const { room, event } = await setupScheduledEvent(api, admin)
  await registerForEvent(api, user, event._id)
  const liveEvent = await startEvent(api, admin, event._id)
  return { room, event: liveEvent }
}
