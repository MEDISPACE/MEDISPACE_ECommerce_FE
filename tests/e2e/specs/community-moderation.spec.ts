/**
 * community-moderation.spec.ts
 *
 * End-to-end tests for:
 *   - Room management (CRUD, archive, unarchive, slug conflict)
 *   - Member lifecycle (join, request, approve, invite, leave, mute via field)
 *   - Message flow (send, list, pagination, read, moderation triggers)
 *   - Report message flow
 *   - Admin moderation queue (filter, search)
 *   - Admin moderation actions (hide, delete, restore, mute, unmute, ban, unban, reopen)
 *   - Audit action log
 *
 * Requires: backend running + npm run seed:e2e done on BE side.
 */
import path from 'node:path'
import { expect, test, type APIRequestContext, type Browser } from '@playwright/test'
import {
  API_URL,
  APP_URL,
  AUTH_DIR,
  type Session,
  archiveRoom,
  auth,
  createAppeal,
  createRoom,
  getAppeals,
  getModerationActions,
  getModerationQueue,
  inviteMember,
  joinRoom,
  leaveRoom,
  listAdminRooms,
  listMembers,
  listMessages,
  listPublicRooms,
  markRoomRead,
  newAuthedPage,
  pickData,
  reportMessage,
  requestJoin,
  resolveAppeal,
  roomMeta,
  sendMessage,
  sessions,
  takeModerationAction,
  tryRawSendMessage,
  unarchiveRoom,
  updateMember,
  updateRoom,
} from './community/helpers'

// ────────────────────────────────────────────────────────────────────────────
// Original 3 tests (kept intact for backward compatibility)
// ────────────────────────────────────────────────────────────────────────────

test.describe.serial('community room, realtime, moderation and appeal', () => {
  test('private room request is approved through member management API', async ({ request }) => {
    const { admin, customer } = sessions()
    const room = await createRoom(request, admin, 'private', 'E2E Private')

    const joinRequest = await requestJoin(request, customer, room._id)
    expect(joinRequest.status).toBe('pending')

    let members = await listMembers(request, admin, room._id)
    const pending = members.find((m: any) => m.userId === customer.user._id)
    expect(pending?.status).toBe('pending')

    await updateMember(request, admin, room._id, customer.user._id, { status: 'active' })
    members = await listMembers(request, admin, room._id)
    const active = members.find((m: any) => m.userId === customer.user._id)
    expect(active?.status).toBe('active')
  })

  test('room list updates unread and message count from realtime events', async ({ browser, request }) => {
    const { admin, customer, customer2 } = sessions()
    const room = await createRoom(request, admin, 'public', 'E2E Realtime')
    await joinRoom(request, customer, room._id)
    await joinRoom(request, customer2, room._id)

    const { context, page } = await newAuthedPage(browser, 'customer.json')
    await page.goto(`${APP_URL}/community`)

    const roomCard = page.locator(`[data-testid="community-room-card"][data-room-id="${room._id}"]`)
    await expect(roomCard).toBeVisible()
    await expect(roomCard).toContainText('0 tin nhắn')
    await expect(roomCard).toHaveAttribute('data-realtime-joined', 'true')

    const content = `E2E realtime message ${Date.now()}`
    await sendMessage(request, customer2, room._id, content)

    await expect(roomCard).toContainText('1 tin nhắn')
    await expect(roomCard).toContainText('1 mới')

    await page.goto(`${APP_URL}/community/${room._id}`)
    await expect(page.getByText(content)).toBeVisible()
    await context.close()
  })

  test('moderation ban can be appealed and approved by admin', async ({ browser, request }) => {
    const { admin, customer } = sessions()
    const room = await createRoom(request, admin, 'public', 'E2E Appeal')
    await joinRoom(request, customer, room._id)

    const hiddenContent = `E2E hidden phone ${Date.now()} 0901234567`
    const sent = await sendMessage(request, customer, room._id, hiddenContent)
    const messageId = sent?.message?._id
    expect(messageId).toBeTruthy()
    expect(sent?.message?.status).toBe('hidden')

    await takeModerationAction(request, admin, messageId, 'ban_user', { targetUserId: customer.user._id })
    let members = await listMembers(request, admin, room._id)
    expect(members.find((m: any) => m.userId === customer.user._id)?.status).toBe('banned')

    const uniqueReason = `E2E unique ban appeal ${Date.now()}-${Math.floor(Math.random() * 99999)}`
    const appeal = await createAppeal(request, customer, room._id, 'ban', { reason: uniqueReason })
    expect(appeal.status).toBe('open')

    // ── Verify appeal appears in admin UI and click Chấp nhận ────────────────
    const { context, page } = await newAuthedPage(browser, 'admin.json')
    await page.goto(`${APP_URL}/admin/moderation`)

    // Scroll down to the appeals section (below moderation queue)
    await expect(page.getByText('Appeal đang chờ xử lý')).toBeVisible()

    // Filter appeals by unique reason so only 1 row shows up
    const appealSearchInput = page.getByPlaceholder(/tìm user|tìm.*lý do/i)
    await appealSearchInput.fill(uniqueReason)
    // Wait for debounce / API reload
    await page.waitForTimeout(600)
    await expect(page.getByText(uniqueReason)).toBeVisible({ timeout: 8_000 })

    // Now there should be exactly 1 appeal row → click its Chấp nhận button
    const [resolveResp] = await Promise.all([
      page.waitForResponse((resp) => resp.url().includes(`/admin/moderation/appeals/${appeal._id}`)),
      page.getByRole('button', { name: /Chấp nhận/i }).first().click(),
    ])
    expect(resolveResp.ok()).toBeTruthy()
    await expect(page.getByText(uniqueReason)).toHaveCount(0)
    await context.close()

    members = await listMembers(request, admin, room._id)
    expect(members.find((m: any) => m.userId === customer.user._id)?.status).toBe('left')
  })
})


// ────────────────────────────────────────────────────────────────────────────
// Room Management
// ────────────────────────────────────────────────────────────────────────────

test.describe.serial('room management', () => {
  test('admin creates public room and it appears in public list', async ({ request }) => {
    const { admin } = sessions()
    const room = await createRoom(request, admin, 'public', 'E2E Pub List')

    const rooms = await listPublicRooms(request)
    const found = rooms.find((r: any) => r._id === room._id)
    expect(found).toBeTruthy()
    expect(found.memberCount).toBe(0)
    expect(found.messageCount).toBe(0)
    expect(found.status).toBe('active')
  })

  test('admin creates private room and it is excluded from public list', async ({ request }) => {
    const { admin } = sessions()
    const room = await createRoom(request, admin, 'private', 'E2E Priv Excl')

    const rooms = await listPublicRooms(request)
    const found = rooms.find((r: any) => r._id === room._id)
    expect(found).toBeUndefined()
  })

  test('admin updates room name and slug', async ({ request }) => {
    const { admin } = sessions()
    const room = await createRoom(request, admin, 'public', 'E2E Update Room')

    const newName = `Updated Room ${Date.now()}`
    const newSlug = `updated-room-${Date.now()}`
    const updated = await updateRoom(request, admin, room._id, { name: newName, slug: newSlug })
    expect(updated.name).toBe(newName)
    expect(updated.slug).toBe(newSlug)
  })

  test('admin archives room – room disappears from public list', async ({ request }) => {
    const { admin } = sessions()
    const room = await createRoom(request, admin, 'public', 'E2E Archive')
    await archiveRoom(request, admin, room._id)

    const rooms = await listPublicRooms(request)
    const found = rooms.find((r: any) => r._id === room._id)
    expect(found).toBeUndefined()
  })

  test('admin unarchives room – room returns to public list', async ({ request }) => {
    const { admin } = sessions()
    const room = await createRoom(request, admin, 'public', 'E2E Unarchive')
    await archiveRoom(request, admin, room._id)
    await unarchiveRoom(request, admin, room._id)

    const rooms = await listPublicRooms(request)
    const found = rooms.find((r: any) => r._id === room._id)
    expect(found).toBeTruthy()
    expect(found.status).toBe('active')
  })

  test('creating room with duplicate slug returns 409', async ({ request }) => {
    const { admin } = sessions()
    const meta = roomMeta('e2e-dup')
    // First room
    const res1 = await request.post(`${API_URL}/admin/community/rooms`, {
      headers: auth(admin.token),
      data: { ...meta, visibility: 'public' },
    })
    expect(res1.ok()).toBeTruthy()

    // Same slug → conflict
    const res2 = await request.post(`${API_URL}/admin/community/rooms`, {
      headers: auth(admin.token),
      data: { ...meta, visibility: 'public' },
    })
    expect(res2.status()).toBe(409)
  })

  test('admin list supports search and status filter', async ({ request }) => {
    const { admin } = sessions()
    const room = await createRoom(request, admin, 'public', 'E2E Search Filter')
    await archiveRoom(request, admin, room._id)

    // status=archived should include our room
    const archivedRooms = await listAdminRooms(request, admin, { status: 'archived' })
    const found = archivedRooms.find((r: any) => r._id === room._id)
    expect(found?.status).toBe('archived')

    // active filter should not include it
    const activeRooms = await listAdminRooms(request, admin, { status: 'active' })
    expect(activeRooms.find((r: any) => r._id === room._id)).toBeUndefined()
  })
})

// ────────────────────────────────────────────────────────────────────────────
// Member Lifecycle
// ────────────────────────────────────────────────────────────────────────────

test.describe.serial('member lifecycle', () => {
  test('customer joins public room → status active', async ({ request }) => {
    const { admin, customer } = sessions()
    const room = await createRoom(request, admin, 'public', 'E2E Join Pub')
    const result = await joinRoom(request, customer, room._id)
    expect(result.status).toBe('active')
  })

  test('customer cannot directly join private room without invite', async ({ request }) => {
    const { admin, customer } = sessions()
    const room = await createRoom(request, admin, 'private', 'E2E Join Priv')

    const res = await request.post(`${API_URL}/community/rooms/${room._id}/join`, {
      headers: auth(customer.token),
      data: {},
    })
    expect(res.status()).toBe(403)
  })

  test('customer sends join-request to private room → status pending', async ({ request }) => {
    const { admin, customer } = sessions()
    const room = await createRoom(request, admin, 'private', 'E2E Join Req')
    const result = await requestJoin(request, customer, room._id)
    expect(result.status).toBe('pending')
  })

  test('admin invites user by userId → invited status', async ({ request }) => {
    const { admin, customer } = sessions()
    const room = await createRoom(request, admin, 'private', 'E2E Invite ID')
    const result = await inviteMember(request, admin, room._id, { userId: customer.user._id })
    expect(result.status).toBe('invited')
  })

  test('admin invites user by email → invited status', async ({ request }) => {
    const { admin, customer } = sessions()
    const room = await createRoom(request, admin, 'private', 'E2E Invite Email')
    const result = await inviteMember(request, admin, room._id, { email: customer.user.email })
    expect(result.status).toBe('invited')
  })

  test('invited user can join private room', async ({ request }) => {
    const { admin, customer } = sessions()
    const room = await createRoom(request, admin, 'private', 'E2E Invite Join')
    await inviteMember(request, admin, room._id, { userId: customer.user._id })

    const result = await joinRoom(request, customer, room._id)
    expect(result.status).toBe('active')

    const members = await listMembers(request, admin, room._id)
    const m = members.find((x: any) => x.userId === customer.user._id)
    expect(m?.status).toBe('active')
  })

  test('active member can leave room', async ({ request }) => {
    const { admin, customer } = sessions()
    const room = await createRoom(request, admin, 'public', 'E2E Leave')
    await joinRoom(request, customer, room._id)

    const result = await leaveRoom(request, customer, room._id)
    expect(result.status).toBe('left')
  })

  test('admin lists members with status filter', async ({ request }) => {
    const { admin, customer, customer2 } = sessions()
    const room = await createRoom(request, admin, 'private', 'E2E Member Filter')
    await requestJoin(request, customer, room._id)
    await inviteMember(request, admin, room._id, { userId: customer2.user._id })

    const pending = await listMembers(request, admin, room._id, { status: 'pending' })
    expect(pending.every((m: any) => m.status === 'pending')).toBe(true)
    expect(pending.find((m: any) => m.userId === customer.user._id)).toBeTruthy()

    const invited = await listMembers(request, admin, room._id, { status: 'invited' })
    expect(invited.every((m: any) => m.status === 'invited')).toBe(true)
    expect(invited.find((m: any) => m.userId === customer2.user._id)).toBeTruthy()
  })

  test('admin sets mutedUntil on member via updateMember', async ({ request }) => {
    const { admin, customer } = sessions()
    const room = await createRoom(request, admin, 'public', 'E2E Mute Field')
    await joinRoom(request, customer, room._id)

    const mutedUntil = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    const result = await updateMember(request, admin, room._id, customer.user._id, { mutedUntil })
    expect(result.mutedUntil).toBeTruthy()
    expect(new Date(result.mutedUntil).getTime()).toBeGreaterThan(Date.now())
  })

  test('unauthenticated user cannot join room – 401', async ({ request }) => {
    const { admin } = sessions()
    const room = await createRoom(request, admin, 'public', 'E2E Auth Guard')

    const res = await request.post(`${API_URL}/community/rooms/${room._id}/join`, {
      data: {},
    })
    expect(res.status()).toBe(401)
  })
})

// ────────────────────────────────────────────────────────────────────────────
// Message Flow
// ────────────────────────────────────────────────────────────────────────────

test.describe.serial('message flow', () => {
  test('member sends clean message – visible, no finding, no auto-hide', async ({ request }) => {
    const { admin, customer } = sessions()
    const room = await createRoom(request, admin, 'public', 'E2E Msg Clean')
    await joinRoom(request, customer, room._id)

    const content = `Hello everyone ${Date.now()}`
    const result = await sendMessage(request, customer, room._id, content)

    expect(result.message.status).toBe('visible')
    expect(result.moderation.severity).toBe('low')
    expect(result.moderation.categories).toHaveLength(0)
    expect(result.message.moderated.autoHidden).toBe(false)
  })

  test('message with phone number → auto-hidden, severity=high', async ({ request }) => {
    const { admin, customer } = sessions()
    const room = await createRoom(request, admin, 'public', 'E2E Msg PII')
    await joinRoom(request, customer, room._id)

    const result = await sendMessage(request, customer, room._id, `Goi cho toi SĐT 0901234567 nha`)
    expect(result.message.status).toBe('hidden')
    expect(result.moderation.severity).toBe('high')
    expect(result.moderation.categories).toContain('pii')
    expect(result.message.moderated.autoHidden).toBe(true)
  })

  test('message with email address → auto-hidden (PII), severity=high', async ({ request }) => {
    const { admin, customer } = sessions()
    const room = await createRoom(request, admin, 'public', 'E2E Msg Email')
    await joinRoom(request, customer, room._id)

    const result = await sendMessage(request, customer, room._id, `Lien he toi qua email test@example.com`)
    expect(result.message.status).toBe('hidden')
    expect(result.moderation.categories).toContain('pii')
  })

  test('message with 2+ URLs → visible but finding created (spam, severity=medium)', async ({ request }) => {
    const { admin, customer } = sessions()
    const room = await createRoom(request, admin, 'public', 'E2E Msg Spam')
    await joinRoom(request, customer, room._id)

    const result = await sendMessage(
      request,
      customer,
      room._id,
      `Xem ngay http://spam1.com va http://spam2.com hot deal`,
    )
    expect(result.message.status).toBe('visible')
    expect(result.moderation.severity).toBe('medium')
    expect(result.moderation.categories).toContain('spam')
    expect(result.message.moderated.autoHidden).toBe(false)
  })

  test('message with toxic keyword → visible but finding created (severity=medium)', async ({
    request,
  }) => {
    const { admin, customer } = sessions()
    const room = await createRoom(request, admin, 'public', 'E2E Msg Toxic')
    await joinRoom(request, customer, room._id)

    const result = await sendMessage(request, customer, room._id, `Đồ ngu quá đi`)
    expect(result.message.status).toBe('visible')
    expect(result.moderation.severity).toBe('medium')
    expect(result.moderation.categories).toContain('toxic')
  })

  test('message with medical_harm signals → auto-hidden, severity=high', async ({ request }) => {
    const { admin, customer } = sessions()
    const room = await createRoom(request, admin, 'public', 'E2E Msg Med Harm')
    await joinRoom(request, customer, room._id)

    const result = await sendMessage(
      request,
      customer,
      room._id,
      `Tự ý tăng liều 5 viên mỗi ngày không cần bác sĩ`,
    )
    expect(result.message.status).toBe('hidden')
    expect(result.moderation.categories).toContain('medical_harm')
  })

  test('non-member cannot send message → 403', async ({ request }) => {
    const { admin, customer } = sessions()
    const room = await createRoom(request, admin, 'public', 'E2E Msg Non Member')
    // Customer hasn't joined

    const res = await tryRawSendMessage(request, customer, room._id, 'Hello from non-member')
    expect(res.status()).toBe(403)
  })

  test('banned user cannot send message → 403', async ({ request }) => {
    const { admin, customer } = sessions()
    const room = await createRoom(request, admin, 'public', 'E2E Msg Banned')
    await joinRoom(request, customer, room._id)

    // Send any msg to get messageId, then ban
    const sent = await sendMessage(request, customer, room._id, `Hello ${Date.now()}`)
    await takeModerationAction(request, admin, sent.message._id, 'ban_user', {
      targetUserId: customer.user._id,
    })

    const res = await tryRawSendMessage(request, customer, room._id, 'Should fail')
    expect(res.status()).toBe(403)
  })

  test('muted user cannot send message during mute period → 403', async ({ request }) => {
    const { admin, customer } = sessions()
    const room = await createRoom(request, admin, 'public', 'E2E Msg Muted')
    await joinRoom(request, customer, room._id)

    // Mute customer for 60 minutes via updateMember
    const mutedUntil = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    await updateMember(request, admin, room._id, customer.user._id, { mutedUntil })

    const res = await tryRawSendMessage(request, customer, room._id, 'Should fail – muted')
    expect(res.status()).toBe(403)
  })

  test('listMessages returns paginated visible messages with sender info', async ({ request }) => {
    const { admin, customer } = sessions()
    const room = await createRoom(request, admin, 'public', 'E2E Msg List')
    await joinRoom(request, customer, room._id)

    const messages = [`Tin nhan 1 ${Date.now()}`, `Tin nhan 2 ${Date.now()}`, `Tin nhan 3 ${Date.now()}`]
    for (const content of messages) {
      await sendMessage(request, customer, room._id, content)
    }

    const result = await listMessages(request, customer, room._id, { limit: 2 })
    expect(result.items.length).toBeLessThanOrEqual(2)
    expect(result.total).toBeGreaterThanOrEqual(3)
    expect(result.items[0].sender).toBeTruthy()
    expect(result.items[0].sender._id).toBeTruthy()
  })

  test('auto-hidden message appears in sender own list (hidden status)', async ({ request }) => {
    const { admin, customer } = sessions()
    const room = await createRoom(request, admin, 'public', 'E2E Msg Hidden Own')
    await joinRoom(request, customer, room._id)

    const sent = await sendMessage(request, customer, room._id, `PII phone 0901234567 test`)
    expect(sent.message.status).toBe('hidden')

    // Sender should see their own hidden message
    const list = await listMessages(request, customer, room._id)
    const found = list.items.find((m: any) => m._id === sent.message._id)
    expect(found).toBeTruthy()
    expect(found.status).toBe('hidden')
  })

  test('mark room read resets unread count', async ({ request }) => {
    const { admin, customer, customer2 } = sessions()
    const room = await createRoom(request, admin, 'public', 'E2E Mark Read')
    await joinRoom(request, customer, room._id)
    await joinRoom(request, customer2, room._id)

    // customer2 sends, customer has unread
    await sendMessage(request, customer2, room._id, `Unread message ${Date.now()}`)
    await markRoomRead(request, customer, room._id)

    // Verify via /rooms/my – unreadCount should be 0
    const myRoomsRes = await request.get(`${API_URL}/community/rooms/my`, {
      headers: auth(customer.token),
    })
    expect(myRoomsRes.ok()).toBeTruthy()
    const myRooms = pickData(await myRoomsRes.json()) as any[]
    const roomData = myRooms.find((r: any) => r._id === room._id)
    expect(roomData?.unreadCount).toBe(0)
  })

  test('message content validation – empty content returns 422', async ({ request }) => {
    const { admin, customer } = sessions()
    const room = await createRoom(request, admin, 'public', 'E2E Msg Validation')
    await joinRoom(request, customer, room._id)

    const res = await request.post(`${API_URL}/community/rooms/${room._id}/messages`, {
      headers: auth(customer.token),
      data: { content: '' },
    })
    expect(res.status()).toBe(422)
  })
})

// ────────────────────────────────────────────────────────────────────────────
// Report Message
// ────────────────────────────────────────────────────────────────────────────

test.describe.serial('report message', () => {
  test('member reports message → finding created with trigger=user_report', async ({ request }) => {
    const { admin, customer, customer2 } = sessions()
    const room = await createRoom(request, admin, 'public', 'E2E Report')
    await joinRoom(request, customer, room._id)
    await joinRoom(request, customer2, room._id)

    const sent = await sendMessage(request, customer, room._id, `Safe message to report ${Date.now()}`)
    const result = await reportMessage(request, customer2, sent.message._id)
    expect(result.findingId).toBeTruthy()

    // Finding should appear in admin queue
    const queue = await getModerationQueue(request, admin)
    const finding = queue.items.find((f: any) => f.messageId === sent.message._id)
    expect(finding).toBeTruthy()
    expect(finding.trigger).toBe('user_report')
  })

  test('same user cannot report same message twice → 409', async ({ request }) => {
    const { admin, customer, customer2 } = sessions()
    const room = await createRoom(request, admin, 'public', 'E2E Report Dup')
    await joinRoom(request, customer, room._id)
    await joinRoom(request, customer2, room._id)

    const sent = await sendMessage(request, customer, room._id, `Report dup target ${Date.now()}`)
    await reportMessage(request, customer2, sent.message._id)

    // Second report by same user
    const res = await request.post(`${API_URL}/community/messages/${sent.message._id}/report`, {
      headers: auth(customer2.token),
      data: { reason: 'duplicate report' },
    })
    expect(res.status()).toBe(409)
  })

  test('reporting message that already has a finding increments reportCount', async ({ request }) => {
    const { admin, customer, customer2 } = sessions()
    const room = await createRoom(request, admin, 'public', 'E2E Report Existing')
    await joinRoom(request, customer, room._id)
    await joinRoom(request, customer2, room._id)

    // Send PII message → creates finding automatically (trigger=auto)
    const sent = await sendMessage(request, customer, room._id, `SĐT: 0901234567 test`)
    expect(sent.message.moderated?.findingId).toBeTruthy()

    // customer2 reports same message → should update existing finding
    await reportMessage(request, customer2, sent.message._id)

    const queue = await getModerationQueue(request, admin)
    const finding = queue.items.find((f: any) => f.messageId === sent.message._id)
    expect(finding?.reportCount).toBeGreaterThanOrEqual(1)
  })
})

// ────────────────────────────────────────────────────────────────────────────
// Admin Moderation Queue + Actions
// ────────────────────────────────────────────────────────────────────────────

test.describe.serial('admin moderation queue and actions', () => {
  test('queue returns findings with embedded room and message details', async ({ request }) => {
    const { admin, customer } = sessions()
    const room = await createRoom(request, admin, 'public', 'E2E Queue Details')
    await joinRoom(request, customer, room._id)

    await sendMessage(request, customer, room._id, `0901234567 phone number leak`)

    const queue = await getModerationQueue(request, admin)
    expect(queue.total).toBeGreaterThanOrEqual(1)
    const item = queue.items[0]
    expect(item.room).toBeTruthy()
    expect(item.message).toBeTruthy()
    expect(item.severity).toBeTruthy()
    expect(item.trigger).toBeTruthy()
  })

  test('queue filter by severity=high returns only high findings', async ({ request }) => {
    const { admin, customer } = sessions()
    const room = await createRoom(request, admin, 'public', 'E2E Queue Severity')
    await joinRoom(request, customer, room._id)
    await sendMessage(request, customer, room._id, `PII phone 0901234567`)

    const queue = await getModerationQueue(request, admin, { severity: 'high' })
    expect(queue.items.every((f: any) => f.severity === 'high')).toBe(true)
  })

  test('queue filter by trigger=auto returns only rule-based findings', async ({ request }) => {
    const { admin, customer } = sessions()
    const room = await createRoom(request, admin, 'public', 'E2E Queue Trigger')
    await joinRoom(request, customer, room._id)
    await sendMessage(request, customer, room._id, `PII 0901234567`)

    const queue = await getModerationQueue(request, admin, { trigger: 'auto' })
    expect(queue.items.every((f: any) => f.trigger === 'auto')).toBe(true)
  })

  test('queue search by room name returns matching findings', async ({ request }) => {
    const { admin, customer } = sessions()
    const uniquePrefix = `E2E Queue Search ${Date.now()}`
    const room = await createRoom(request, admin, 'public', uniquePrefix)
    await joinRoom(request, customer, room._id)
    await sendMessage(request, customer, room._id, `PII 0901234567`)

    const queue = await getModerationQueue(request, admin, { search: room.name })
    const found = queue.items.find((f: any) => f.room?.name === room.name)
    expect(found).toBeTruthy()
  })

  test('admin hides message → status=hidden, finding=resolved', async ({ request }) => {
    const { admin, customer } = sessions()
    const room = await createRoom(request, admin, 'public', 'E2E Action Hide')
    await joinRoom(request, customer, room._id)

    const sent = await sendMessage(request, customer, room._id, `dm you are wrong ${Date.now()}`)
    expect(sent.message.status).toBe('visible')

    const result = await takeModerationAction(request, admin, sent.message._id, 'hide')
    expect(result.message.status).toBe('hidden')

    // Finding should be resolved
    const queue = await getModerationQueue(request, admin)
    const finding = queue.items.find((f: any) => f.messageId === sent.message._id)
    expect(finding).toBeUndefined() // resolved, not in open queue
  })

  test('admin deletes message → status=deleted, content=[deleted]', async ({ request }) => {
    const { admin, customer } = sessions()
    const room = await createRoom(request, admin, 'public', 'E2E Action Delete')
    await joinRoom(request, customer, room._id)

    const originalContent = `Delete me ${Date.now()}`
    const sent = await sendMessage(request, customer, room._id, originalContent)

    const result = await takeModerationAction(request, admin, sent.message._id, 'delete')
    expect(result.message.status).toBe('deleted')
    expect(result.message.content).toBe('[deleted]')
  })

  test('admin restores message → status=visible', async ({ request }) => {
    const { admin, customer } = sessions()
    const room = await createRoom(request, admin, 'public', 'E2E Action Restore')
    await joinRoom(request, customer, room._id)

    // Send PII → auto-hidden
    const sent = await sendMessage(request, customer, room._id, `0912345678 pii`)
    expect(sent.message.status).toBe('hidden')

    const result = await takeModerationAction(request, admin, sent.message._id, 'restore_message')
    expect(result.message.status).toBe('visible')
  })

  test('admin mutes user via action → member.mutedUntil is set', async ({ request }) => {
    const { admin, customer } = sessions()
    const room = await createRoom(request, admin, 'public', 'E2E Action Mute')
    await joinRoom(request, customer, room._id)

    const sent = await sendMessage(request, customer, room._id, `Mute target ${Date.now()}`)
    await takeModerationAction(request, admin, sent.message._id, 'mute_user', {
      durationMinutes: 60,
      targetUserId: customer.user._id,
    })

    const members = await listMembers(request, admin, room._id)
    const m = members.find((x: any) => x.userId === customer.user._id)
    expect(m?.mutedUntil).toBeTruthy()
    expect(new Date(m.mutedUntil).getTime()).toBeGreaterThan(Date.now())
  })

  test('admin unmutes user → mutedUntil=null', async ({ request }) => {
    const { admin, customer } = sessions()
    const room = await createRoom(request, admin, 'public', 'E2E Action Unmute')
    await joinRoom(request, customer, room._id)

    // Mute first
    const sent = await sendMessage(request, customer, room._id, `Unmute me ${Date.now()}`)
    await takeModerationAction(request, admin, sent.message._id, 'mute_user', {
      durationMinutes: 60,
      targetUserId: customer.user._id,
    })

    // Unmute
    await takeModerationAction(request, admin, sent.message._id, 'unmute_user', {
      targetUserId: customer.user._id,
    })

    const members = await listMembers(request, admin, room._id)
    const m = members.find((x: any) => x.userId === customer.user._id)
    expect(m?.mutedUntil).toBeNull()
  })

  test('admin bans user → member.status=banned', async ({ request }) => {
    const { admin, customer } = sessions()
    const room = await createRoom(request, admin, 'public', 'E2E Action Ban')
    await joinRoom(request, customer, room._id)

    const sent = await sendMessage(request, customer, room._id, `Ban this ${Date.now()}`)
    await takeModerationAction(request, admin, sent.message._id, 'ban_user', {
      targetUserId: customer.user._id,
    })

    const members = await listMembers(request, admin, room._id)
    const m = members.find((x: any) => x.userId === customer.user._id)
    expect(m?.status).toBe('banned')
  })

  test('admin unbans user → member.status=left', async ({ request }) => {
    const { admin, customer } = sessions()
    const room = await createRoom(request, admin, 'public', 'E2E Action Unban')
    await joinRoom(request, customer, room._id)

    const sent = await sendMessage(request, customer, room._id, `Unban me ${Date.now()}`)
    await takeModerationAction(request, admin, sent.message._id, 'ban_user', {
      targetUserId: customer.user._id,
    })
    await takeModerationAction(request, admin, sent.message._id, 'unban_user', {
      targetUserId: customer.user._id,
    })

    const members = await listMembers(request, admin, room._id)
    const m = members.find((x: any) => x.userId === customer.user._id)
    expect(m?.status).toBe('left')
  })

  test('admin reopens resolved finding → finding.status=open again', async ({ request }) => {
    const { admin, customer } = sessions()
    const room = await createRoom(request, admin, 'public', 'E2E Action Reopen')
    await joinRoom(request, customer, room._id)

    // Auto-hide → finding created
    const sent = await sendMessage(request, customer, room._id, `PII 0901234567 reopen test`)

    // Resolve by approving
    await takeModerationAction(request, admin, sent.message._id, 'approve')

    // Queue should be empty for this message
    const queueBefore = await getModerationQueue(request, admin)
    expect(queueBefore.items.find((f: any) => f.messageId === sent.message._id)).toBeUndefined()

    // Reopen
    await takeModerationAction(request, admin, sent.message._id, 'reopen_finding')

    // Should appear in queue again
    const queueAfter = await getModerationQueue(request, admin)
    const reopened = queueAfter.items.find((f: any) => f.messageId === sent.message._id)
    expect(reopened).toBeTruthy()
    expect(reopened.status).toBe('open')
  })

  test('every admin action creates an audit log entry', async ({ request }) => {
    const { admin, customer } = sessions()
    const room = await createRoom(request, admin, 'public', 'E2E Audit Log')
    await joinRoom(request, customer, room._id)

    const sent = await sendMessage(request, customer, room._id, `Audit target ${Date.now()}`)
    await takeModerationAction(request, admin, sent.message._id, 'hide')

    const actions = await getModerationActions(request, admin, { messageId: sent.message._id })
    const entry = actions.items.find((a: any) => a.messageId === sent.message._id && a.action === 'hide')
    expect(entry).toBeTruthy()
    expect(entry.performedBy).toBeTruthy()
    expect(entry.performedByUser).toBeTruthy()
  })

  test('moderation actions filter by action type', async ({ request }) => {
    const { admin, customer } = sessions()
    const room = await createRoom(request, admin, 'public', 'E2E Action Filter')
    await joinRoom(request, customer, room._id)

    const sent = await sendMessage(request, customer, room._id, `Filter actions ${Date.now()}`)
    await takeModerationAction(request, admin, sent.message._id, 'hide')

    const actions = await getModerationActions(request, admin, { action: 'hide' })
    expect(actions.items.every((a: any) => a.action === 'hide')).toBe(true)
  })

  test('invalid action value returns 422', async ({ request }) => {
    const { admin, customer } = sessions()
    const room = await createRoom(request, admin, 'public', 'E2E Action Invalid')
    await joinRoom(request, customer, room._id)

    const sent = await sendMessage(request, customer, room._id, `Invalid action test ${Date.now()}`)
    const res = await request.patch(`${API_URL}/admin/moderation/messages/${sent.message._id}/action`, {
      headers: auth(admin.token),
      data: { action: 'dismiss' }, // not in allowed enum
    })
    expect(res.status()).toBe(422)
  })

  test('non-admin cannot access moderation queue → 403', async ({ request }) => {
    const { customer } = sessions()
    const res = await request.get(`${API_URL}/admin/moderation/queue`, {
      headers: auth(customer.token),
    })
    expect(res.status()).toBe(403)
  })
})
