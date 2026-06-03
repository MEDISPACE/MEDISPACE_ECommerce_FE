/**
 * community-appeals.spec.ts
 *
 * End-to-end tests for Appeal flow:
 *   - Ban appeal (create, approve, reject, duplicate)
 *   - Mute appeal (create, approve, rejected)
 *   - Message appeal (create, approve, reject)
 *   - Admin filter appeals by status / type
 *
 * Requires: backend running + npm run seed:e2e done on BE side.
 */
import { expect, test } from '@playwright/test'
import {
  createAppeal,
  createRoom,
  getAppeals,
  joinRoom,
  listMembers,
  listMessages,
  reportMessage,
  resolveAppeal,
  sendMessage,
  sessions,
  takeModerationAction,
  updateMember,
  API_URL,
  auth,
} from './community/helpers'

// ────────────────────────────────────────────────────────────────────────────
// Ban Appeals
// ────────────────────────────────────────────────────────────────────────────

test.describe.serial('ban appeal flow', () => {
  test('banned customer submits ban appeal → status=open', async ({ request }) => {
    const { admin, customer } = sessions()
    const room = await createRoom(request, admin, 'public', 'E2E Ban Appeal')
    await joinRoom(request, customer, room._id)

    const sent = await sendMessage(request, customer, room._id, `Ban target ${Date.now()}`)
    await takeModerationAction(request, admin, sent.message._id, 'ban_user', {
      targetUserId: customer.user._id,
    })

    const appeal = await createAppeal(request, customer, room._id, 'ban')
    expect(appeal.status).toBe('open')
    expect(appeal.type).toBe('ban')
    expect(appeal.userId).toBe(customer.user._id)
  })

  test('submitting duplicate ban appeal returns 409', async ({ request }) => {
    const { admin, customer } = sessions()
    const room = await createRoom(request, admin, 'public', 'E2E Ban Appeal Dup')
    await joinRoom(request, customer, room._id)

    const sent = await sendMessage(request, customer, room._id, `Dup ban ${Date.now()}`)
    await takeModerationAction(request, admin, sent.message._id, 'ban_user', {
      targetUserId: customer.user._id,
    })

    // First appeal
    await createAppeal(request, customer, room._id, 'ban')

    // Duplicate appeal
    const res = await request.post(`${API_URL}/community/rooms/${room._id}/appeals`, {
      headers: auth(customer.token),
      data: { type: 'ban', reason: 'Duplicate ban appeal reason here' },
    })
    expect(res.status()).toBe(409)
  })

  test('admin approves ban appeal → member.status=left, appeal.status=approved', async ({ request }) => {
    const { admin, customer } = sessions()
    const room = await createRoom(request, admin, 'public', 'E2E Ban Approve')
    await joinRoom(request, customer, room._id)

    const sent = await sendMessage(request, customer, room._id, `Ban for appeal ${Date.now()}`)
    await takeModerationAction(request, admin, sent.message._id, 'ban_user', {
      targetUserId: customer.user._id,
    })

    const appeal = await createAppeal(request, customer, room._id, 'ban')
    const resolved = await resolveAppeal(request, admin, appeal._id, 'approved', 'Approved after review')

    expect(resolved.status).toBe('approved')
    expect(resolved.decisionNotes).toBe('Approved after review')

    const members = await listMembers(request, admin, room._id)
    const m = members.find((x: any) => x.userId === customer.user._id)
    expect(m?.status).toBe('left') // can rejoin
  })

  test('admin rejects ban appeal → appeal.status=rejected, member still banned', async ({ request }) => {
    const { admin, customer } = sessions()
    const room = await createRoom(request, admin, 'public', 'E2E Ban Reject')
    await joinRoom(request, customer, room._id)

    const sent = await sendMessage(request, customer, room._id, `Reject ban ${Date.now()}`)
    await takeModerationAction(request, admin, sent.message._id, 'ban_user', {
      targetUserId: customer.user._id,
    })

    const appeal = await createAppeal(request, customer, room._id, 'ban')
    const resolved = await resolveAppeal(request, admin, appeal._id, 'rejected', 'Ban upheld')

    expect(resolved.status).toBe('rejected')

    const members = await listMembers(request, admin, room._id)
    const m = members.find((x: any) => x.userId === customer.user._id)
    expect(m?.status).toBe('banned') // still banned
  })

  test('resolving already-resolved appeal returns 409', async ({ request }) => {
    const { admin, customer } = sessions()
    const room = await createRoom(request, admin, 'public', 'E2E Appeal Double Resolve')
    await joinRoom(request, customer, room._id)

    const sent = await sendMessage(request, customer, room._id, `Double resolve ${Date.now()}`)
    await takeModerationAction(request, admin, sent.message._id, 'ban_user', {
      targetUserId: customer.user._id,
    })

    const appeal = await createAppeal(request, customer, room._id, 'ban')
    await resolveAppeal(request, admin, appeal._id, 'rejected')

    // Try to resolve again
    const res = await request.patch(`${API_URL}/admin/moderation/appeals/${appeal._id}`, {
      headers: auth(admin.token),
      data: { decision: 'approved', notes: 'Second attempt' },
    })
    expect(res.status()).toBe(409)
  })

  test('non-banned user cannot create ban appeal → 400', async ({ request }) => {
    const { admin, customer } = sessions()
    const room = await createRoom(request, admin, 'public', 'E2E Ban Appeal Not Banned')
    await joinRoom(request, customer, room._id)

    const res = await request.post(`${API_URL}/community/rooms/${room._id}/appeals`, {
      headers: auth(customer.token),
      data: { type: 'ban', reason: 'I am not actually banned but trying to appeal' },
    })
    expect(res.status()).toBe(400)
  })
})

// ────────────────────────────────────────────────────────────────────────────
// Mute Appeals
// ────────────────────────────────────────────────────────────────────────────

test.describe.serial('mute appeal flow', () => {
  test('muted customer submits mute appeal → status=open', async ({ request }) => {
    const { admin, customer } = sessions()
    const room = await createRoom(request, admin, 'public', 'E2E Mute Appeal')
    await joinRoom(request, customer, room._id)

    // Mute customer for 60 minutes
    const mutedUntil = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    await updateMember(request, admin, room._id, customer.user._id, { mutedUntil })

    const appeal = await createAppeal(request, customer, room._id, 'mute')
    expect(appeal.status).toBe('open')
    expect(appeal.type).toBe('mute')
  })

  test('admin approves mute appeal → mutedUntil=null', async ({ request }) => {
    const { admin, customer } = sessions()
    const room = await createRoom(request, admin, 'public', 'E2E Mute Approve')
    await joinRoom(request, customer, room._id)

    const mutedUntil = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    await updateMember(request, admin, room._id, customer.user._id, { mutedUntil })

    const appeal = await createAppeal(request, customer, room._id, 'mute')
    await resolveAppeal(request, admin, appeal._id, 'approved')

    const members = await listMembers(request, admin, room._id)
    const m = members.find((x: any) => x.userId === customer.user._id)
    expect(m?.mutedUntil).toBeNull()
  })

  test('admin rejects mute appeal → user remains muted', async ({ request }) => {
    const { admin, customer } = sessions()
    const room = await createRoom(request, admin, 'public', 'E2E Mute Reject')
    await joinRoom(request, customer, room._id)

    const mutedUntil = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    await updateMember(request, admin, room._id, customer.user._id, { mutedUntil })

    const appeal = await createAppeal(request, customer, room._id, 'mute')
    const resolved = await resolveAppeal(request, admin, appeal._id, 'rejected')
    expect(resolved.status).toBe('rejected')

    const members = await listMembers(request, admin, room._id)
    const m = members.find((x: any) => x.userId === customer.user._id)
    expect(m?.mutedUntil).toBeTruthy() // still muted
  })

  test('non-muted user cannot create mute appeal → 400', async ({ request }) => {
    const { admin, customer } = sessions()
    const room = await createRoom(request, admin, 'public', 'E2E Mute Not Muted')
    await joinRoom(request, customer, room._id)

    const res = await request.post(`${API_URL}/community/rooms/${room._id}/appeals`, {
      headers: auth(customer.token),
      data: { type: 'mute', reason: 'I am not muted but trying to appeal anyway' },
    })
    expect(res.status()).toBe(400)
  })
})

// ────────────────────────────────────────────────────────────────────────────
// Message Appeals
// ────────────────────────────────────────────────────────────────────────────

test.describe.serial('message appeal flow', () => {
  test('customer appeals hidden message → appeal created with messageId', async ({ request }) => {
    const { admin, customer } = sessions()
    const room = await createRoom(request, admin, 'public', 'E2E Msg Appeal')
    await joinRoom(request, customer, room._id)

    // Send PII → auto-hidden
    const sent = await sendMessage(request, customer, room._id, `Phone 0901234567 appeal test`)
    expect(sent.message.status).toBe('hidden')

    const appeal = await createAppeal(request, customer, room._id, 'message', {
      messageId: sent.message._id,
    })
    expect(appeal.status).toBe('open')
    expect(appeal.type).toBe('message')
    expect(appeal.messageId).toBe(sent.message._id)
  })

  test('admin approves message appeal → message.status=visible', async ({ request }) => {
    const { admin, customer } = sessions()
    const room = await createRoom(request, admin, 'public', 'E2E Msg Appeal Approve')
    await joinRoom(request, customer, room._id)

    const sent = await sendMessage(request, customer, room._id, `Phone 0901234567 restore me`)
    const appeal = await createAppeal(request, customer, room._id, 'message', {
      messageId: sent.message._id,
    })
    await resolveAppeal(request, admin, appeal._id, 'approved')

    // Message should be visible now
    const list = await listMessages(request, customer, room._id)
    const msg = list.items.find((m: any) => m._id === sent.message._id)
    expect(msg?.status).toBe('visible')
  })

  test('admin rejects message appeal → message remains hidden', async ({ request }) => {
    const { admin, customer } = sessions()
    const room = await createRoom(request, admin, 'public', 'E2E Msg Appeal Reject')
    await joinRoom(request, customer, room._id)

    const sent = await sendMessage(request, customer, room._id, `Phone 0901234567 stay hidden`)
    const appeal = await createAppeal(request, customer, room._id, 'message', {
      messageId: sent.message._id,
    })
    await resolveAppeal(request, admin, appeal._id, 'rejected', 'Message violates community rules')

    const list = await listMessages(request, customer, room._id)
    const msg = list.items.find((m: any) => m._id === sent.message._id)
    expect(msg?.status).toBe('hidden')
  })

  test('message appeal without messageId returns 400', async ({ request }) => {
    const { admin, customer } = sessions()
    const room = await createRoom(request, admin, 'public', 'E2E Msg Appeal No ID')
    await joinRoom(request, customer, room._id)

    const res = await request.post(`${API_URL}/community/rooms/${room._id}/appeals`, {
      headers: auth(customer.token),
      data: { type: 'message', reason: 'Missing messageId in this appeal request' },
    })
    expect(res.status()).toBe(400)
  })

  test('customer cannot appeal another users message', async ({ request }) => {
    const { admin, customer, customer2 } = sessions()
    const room = await createRoom(request, admin, 'public', 'E2E Msg Appeal Wrong User')
    await joinRoom(request, customer, room._id)
    await joinRoom(request, customer2, room._id)

    // customer sends, customer2 tries to appeal it as their own
    const sent = await sendMessage(request, customer, room._id, `PII 0901234567 foreign appeal`)

    const res = await request.post(`${API_URL}/community/rooms/${room._id}/appeals`, {
      headers: auth(customer2.token),
      data: {
        type: 'message',
        reason: 'Trying to appeal someone elses message – should fail',
        messageId: sent.message._id,
      },
    })
    expect(res.status()).toBe(404) // message not found for senderId=customer2
  })
})

// ────────────────────────────────────────────────────────────────────────────
// Appeal List Filters
// ────────────────────────────────────────────────────────────────────────────

test.describe.serial('appeal list filters', () => {
  test('admin filters appeals by status=open', async ({ request }) => {
    const { admin } = sessions()
    const result = await getAppeals(request, admin, { status: 'open' })
    expect(result.items.every((a: any) => a.status === 'open')).toBe(true)
  })

  test('admin filters appeals by status=approved', async ({ request }) => {
    const { admin, customer } = sessions()
    const room = await createRoom(request, admin, 'public', 'E2E Appeals Approved Filter')
    await joinRoom(request, customer, room._id)

    const sent = await sendMessage(request, customer, room._id, `PII 0901234567 filter test`)
    await takeModerationAction(request, admin, sent.message._id, 'ban_user', {
      targetUserId: customer.user._id,
    })
    const appeal = await createAppeal(request, customer, room._id, 'ban')
    await resolveAppeal(request, admin, appeal._id, 'approved')

    const result = await getAppeals(request, admin, { status: 'approved' })
    expect(result.items.every((a: any) => a.status === 'approved')).toBe(true)
    expect(result.items.find((a: any) => a._id === appeal._id)).toBeTruthy()
  })

  test('admin filters appeals by type=ban', async ({ request }) => {
    const { admin } = sessions()
    const result = await getAppeals(request, admin, { type: 'ban' })
    expect(result.items.every((a: any) => a.type === 'ban')).toBe(true)
  })

  test('admin filters appeals by type=mute', async ({ request }) => {
    const { admin } = sessions()
    const result = await getAppeals(request, admin, { type: 'mute' })
    expect(result.items.every((a: any) => a.type === 'mute')).toBe(true)
  })

  test('admin filters appeals by type=message', async ({ request }) => {
    const { admin } = sessions()
    const result = await getAppeals(request, admin, { type: 'message' })
    expect(result.items.every((a: any) => a.type === 'message')).toBe(true)
  })

  test('appeal reason validation – reason too short returns 422', async ({ request }) => {
    const { admin, customer } = sessions()
    const room = await createRoom(request, admin, 'public', 'E2E Appeal Validation')
    await joinRoom(request, customer, room._id)

    const sent = await sendMessage(request, customer, room._id, `PII 0901234567 short reason`)
    await takeModerationAction(request, admin, sent.message._id, 'ban_user', {
      targetUserId: customer.user._id,
    })

    const res = await request.post(`${API_URL}/community/rooms/${room._id}/appeals`, {
      headers: auth(customer.token),
      data: { type: 'ban', reason: 'too short' }, // less than 10 chars
    })
    expect(res.status()).toBe(422)
  })
})
