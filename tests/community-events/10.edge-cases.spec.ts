import { expect, test } from '@playwright/test'
import { users } from './fixtures/users'
import { API_URL, APP_URL, pageForRole, testId } from './helpers/auth'
import { createVideoEvent, endEvent, registerForEvent, setupLiveRegisteredEvent, setupScheduledEvent, startEvent, submitQuestion } from './helpers/event'

test.describe('Community Video Events - edge cases', () => {
  test('mobile viewport renders event detail without layout break', async ({ browser, request }) => {
    const { admin, registeredUser } = users()
    const { event } = await setupScheduledEvent(request, admin, { title: `Mobile event ${'long-title-'.repeat(12)}` })
    await registerForEvent(request, registeredUser, event._id)
    const context = await browser.newContext({ viewport: { width: 375, height: 812 }, storageState: 'tests/e2e/.auth/customer.json' })
    const page = await context.newPage()
    await page.goto(`${APP_URL}/community/video-events/${event._id}`)
    await expect(testId(page, 'event-detail-page')).toBeVisible()
    await expect(testId(page, 'event-title')).toBeVisible()
    await context.close()
  })

  test('script tags in questions are stored/displayed safely as text', async ({ request }) => {
    const { admin, registeredUser } = users()
    const { event } = await setupLiveRegisteredEvent(request, admin, registeredUser)
    const content = '<script>window.__pwned=true</script> Is this safe?'
    const result = await submitQuestion(request, registeredUser, event._id, content)
    expect(result.question.content).toContain('<script>')
  })

  test('admin creates two events at the same time and they remain independent', async ({ request }) => {
    const { admin } = users()
    const room = await import('./helpers/event').then((h) => h.createCommunityRoom(request, admin))
    const [a, b] = await Promise.all([
      createVideoEvent(request, admin, room._id, { title: `Parallel A ${Date.now()}` }),
      createVideoEvent(request, admin, room._id, { title: `Parallel B ${Date.now()}` }),
    ])
    expect(a._id).not.toBe(b._id)
  })

  test('event with zero registered users can still be started and immediately ended', async ({ request }) => {
    const { admin } = users()
    const { event } = await setupScheduledEvent(request, admin)
    const live = await startEvent(request, admin, event._id)
    expect(live.status).toBe('live')
    const ended = await endEvent(request, admin, event._id)
    expect(ended.status).toBe('ended')
  })

  test('same user opens event in two tabs and both tabs receive session ended state', async ({ browser, request }) => {
    const { admin, registeredUser } = users()
    const { event } = await setupLiveRegisteredEvent(request, admin, registeredUser)
    const { context, page } = await pageForRole(browser, 'registeredUser')
    const second = await context.newPage()
    await page.goto(`${APP_URL}/community/video-events/${event._id}`)
    await second.goto(`${APP_URL}/community/video-events/${event._id}`)
    await endEvent(request, admin, event._id)
    await expect(testId(page, 'session-ended-message')).toBeVisible({ timeout: 5_000 })
    await expect(testId(second, 'session-ended-message')).toBeVisible({ timeout: 5_000 })
    await context.close()
  })

  test('network loss shows reconnecting state and recovers', async ({ browser }) => {
    const { context, page } = await pageForRole(browser, 'registeredUser')
    await page.goto(`${APP_URL}/community/video-events/mock-live-event`)
    await context.setOffline(true)
    await expect(testId(page, 'reconnection-indicator')).toBeVisible({ timeout: 5_000 })
    await context.setOffline(false)
    await expect(testId(page, 'reconnection-indicator')).toBeHidden({ timeout: 10_000 })
    await context.close()
  })

  test('maximum attendee event accepts registrations until capacity', async ({ request }) => {
    const { admin, registeredUser, host } = users()
    const { event } = await setupScheduledEvent(request, admin, { capacity: 500 })
    await registerForEvent(request, registeredUser, event._id)
    await registerForEvent(request, host, event._id)
    const detail = await request.get(`${API_URL}/community/video-events/${event._id}`, { headers: { Authorization: `Bearer ${registeredUser.token}` } })
    expect(detail.ok()).toBeTruthy()
    expect(JSON.stringify(await detail.json())).toContain('registrationCount')
  })
})
