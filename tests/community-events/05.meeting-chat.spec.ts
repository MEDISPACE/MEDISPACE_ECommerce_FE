import { expect, test } from '@playwright/test'
import { users } from './fixtures/users'
import { API_URL } from './helpers/auth'
import { joinCommunityRoom, listRoomMessages, sendRoomMessage, setupLiveRegisteredEvent } from './helpers/event'

test.describe('Community Video Events - meeting chat', () => {
  test('registered user in live event sends realtime room chat messages', async ({ request }) => {
    const { admin, registeredUser } = users()
    const { room } = await setupLiveRegisteredEvent(request, admin, registeredUser)

    await joinCommunityRoom(request, registeredUser, room._id)
    const first = await sendRoomMessage(request, registeredUser, room._id, `First meeting chat ${Date.now()}`)
    const second = await sendRoomMessage(request, registeredUser, room._id, `Second meeting chat ${Date.now()}`)

    expect(first.message.status).toMatch(/visible|hidden/)
    expect(second.message.status).toMatch(/visible|hidden/)

    const messages = await listRoomMessages(request, registeredUser, room._id)
    expect(messages.length).toBeGreaterThanOrEqual(2)
  })

  test('empty, whitespace, and over-limit chat messages are blocked', async ({ request }) => {
    const { admin, registeredUser } = users()
    const { room } = await setupLiveRegisteredEvent(request, admin, registeredUser)
    await joinCommunityRoom(request, registeredUser, room._id)

    await sendRoomMessage(request, registeredUser, room._id, '', 422)
    await sendRoomMessage(request, registeredUser, room._id, '   ', 422)
    await sendRoomMessage(request, registeredUser, room._id, 'x'.repeat(2100), 422)
  })

  test('rapid chat submissions remain bounded by API validation/rate limits', async ({ request }) => {
    const { admin, registeredUser } = users()
    const { room } = await setupLiveRegisteredEvent(request, admin, registeredUser)
    await joinCommunityRoom(request, registeredUser, room._id)

    const responses = await Promise.all(
      Array.from({ length: 10 }, (_, index) =>
        request.post(`${API_URL}/community/rooms/${room._id}/messages`, {
          headers: { Authorization: `Bearer ${registeredUser.token}` },
          data: { content: `Rapid meeting chat ${index} ${Date.now()}` },
        }),
      ),
    )

    expect(responses.every((response) => [201, 429].includes(response.status()))).toBeTruthy()
  })
})
