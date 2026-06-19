import { expect, test, type Page } from '@playwright/test'
import { APP_URL } from './helpers/auth'

const event = {
  _id: 'visual-event-1',
  roomId: 'visual-room-1',
  title: 'Chăm sóc sức khỏe tim mạch cho cộng đồng',
  description: 'Buổi chia sẻ kiến thức, kỹ năng và kinh nghiệm sử dụng thuốc an toàn từ dược sĩ MEDISPACE.',
  agenda: '1. Kiến thức nền\n2. Tình huống thường gặp\n3. Chat trao đổi trực tiếp',
  visibility: 'public',
  status: 'scheduled',
  scheduledStartAt: '2099-06-17T09:00:00.000Z',
  scheduledEndAt: '2099-06-17T10:00:00.000Z',
  registrationCount: 42,
  capacity: 120,
  registrationRequired: true,
  provider: 'livekit',
  room: { _id: 'visual-room-1', name: 'Cộng đồng tim mạch', slug: 'tim-mach', diseaseKey: 'cardio', visibility: 'public' },
  viewerRegistration: { status: 'registered' },
}

const liveEvent = { ...event, status: 'live' }

async function seedAuth(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('medispace_access_token', 'visual-token')
    window.localStorage.setItem('medispace_session_hint', '1')
    window.localStorage.setItem('medispace_user_data', JSON.stringify({ _id: 'visual-user', email: 'visual@medispace.local', firstName: 'Visual', lastName: 'Admin', role: 2 }))
  })
  const visualUser = { _id: 'visual-user', email: 'visual@medispace.local', firstName: 'Visual', lastName: 'Admin', role: 2 }
  await page.route('**/users/me**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'OK', user: visualUser }),
    })
  })
  await page.route('**/users/refresh-token**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'OK', result: { accessToken: 'visual-token' } }),
    })
  })
}

async function mockCommunityVideoApis(page: Page, variant: 'scheduled' | 'live' = 'scheduled') {
  const selected = variant === 'live' ? liveEvent : event
  await page.route('**/community/video-events?**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: { items: [selected], page: 1, limit: 30, total: 1 } }),
    })
  })
  await page.route('**/community/video-events/visual-event-1', (route) => {
    if (route.request().resourceType() === 'document') return route.continue()
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: selected }) })
  })
  await page.route('**/community/rooms/visual-room-1/messages**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          items: [
            { _id: 'm1', roomId: selected.roomId, senderId: 'u1', content: 'Người cao tuổi nên lưu ý gì trước khi dùng thuốc tim mạch?', status: 'visible', createdAt: '2099-06-17T08:00:00.000Z', sender: { firstName: 'Minh' } },
            { _id: 'm2', roomId: selected.roomId, senderId: 'visual-user', content: 'Dược sĩ sẽ phản hồi trực tiếp trong phần trao đổi.', status: 'visible', createdAt: '2099-06-17T08:05:00.000Z', sender: { firstName: 'Visual' } },
          ],
          page: 1,
          limit: 80,
          total: 2,
        },
      }),
    })
  })
  await page.route('**/community/video-events/visual-event-1/join', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: { eventId: selected._id, provider: 'livekit', wsUrl: 'wss://visual-livekit.local', token: 'visual-token', role: 'attendee', expiresAt: '2099-06-17T11:00:00.000Z' } }),
    })
  })
}

async function mockAdminVideoApis(page: Page) {
  await page.route('**/admin/dashboard/stats', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        result: {
          revenue: { total: 0, today: 0 },
          orders: { total: 0, todayCount: 0, pending: 0 },
          users: { total: 1, newToday: 0 },
          products: { total: 0, lowStock: 0 },
          prescriptions: { total: 0, pending: 0 },
        },
      }),
    })
  })
  await page.route('**/notifications**', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: { items: [], total: 0 } }) })
  })
  await page.route('**/admin/community/rooms**', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [event.room] }) })
  })
  await page.route('**/admin/community/video-events?**', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: { items: [event, liveEvent], page: 1, limit: 50, total: 2 } }) })
  })
  await page.route('**/admin/community/video-events/*/registrations**', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: { items: [{ _id: 'reg-1', userId: 'u1', status: 'registered', user: { firstName: 'Minh', email: 'minh@example.test' } }], page: 1, limit: 50, total: 1 } }) })
  })
}

test.describe('Community Video Events - visual UI/UX screenshots', () => {
  test('public listing desktop visual', async ({ page }) => {
    await mockCommunityVideoApis(page)
    await page.goto(`${APP_URL}/community/video-events`)
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveScreenshot('community-video-events-list-desktop.png', { fullPage: true, maxDiffPixelRatio: 0.02 })
  })

  test('public listing mobile visual', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await mockCommunityVideoApis(page)
    await page.goto(`${APP_URL}/community/video-events`)
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveScreenshot('community-video-events-list-mobile.png', { fullPage: true, maxDiffPixelRatio: 0.02 })
  })

  test('event detail scheduled Meet prejoin visual', async ({ page }) => {
    await seedAuth(page)
    await mockCommunityVideoApis(page)
    await page.goto(`${APP_URL}/community/video-events/visual-event-1`)
    await expect(page.getByText('Sẵn sàng tham gia?')).toBeVisible()
    await expect(page).toHaveScreenshot('community-video-event-detail-scheduled.png', { fullPage: true, maxDiffPixelRatio: 0.02 })
  })

  test('live event pre-join visual', async ({ page }) => {
    await seedAuth(page)
    await mockCommunityVideoApis(page, 'live')
    await page.goto(`${APP_URL}/community/video-events/visual-event-1`)
    await expect(page.getByRole('button', { name: /tham gia ngay/i })).toBeVisible()
    await expect(page).toHaveScreenshot('community-video-event-live-prejoin.png', { fullPage: true, maxDiffPixelRatio: 0.02 })
  })

  test('admin event operations visual', async ({ page }) => {
    await seedAuth(page)
    await mockAdminVideoApis(page)
    await page.goto(`${APP_URL}/admin/video-events`)
    await expect(page.getByText('Tạo link cuộc họp')).toBeVisible()
    await expect(page).toHaveScreenshot('admin-community-video-events-dashboard.png', { fullPage: true, maxDiffPixelRatio: 0.02 })
  })
})
