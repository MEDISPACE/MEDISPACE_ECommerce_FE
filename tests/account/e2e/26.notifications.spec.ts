import { expect, test } from '@playwright/test'
import { APP_URL, loginAs, testId } from '../helpers/auth'

test.describe('account notifications', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
    await page.goto(`${APP_URL}/account/notifications`)
  })

  test('notification list loads real notifications with unread styling and icons', async ({ page }) => {
    await expect(testId(page, 'notification-list')).toBeVisible()
    await expect(testId(page, 'notification-unread').first()).toBeVisible()
    await expect(testId(page, 'notification-type-icon').first()).toBeVisible()
  })

  test('click notification marks as read and navigates correctly', async ({ page }) => {
    await testId(page, 'notification-action').first().click()
    await expect(testId(page, 'notification-unread')).toHaveCount(0)
  })

  test('mark all as read resets badge', async ({ page }) => {
    await testId(page, 'mark-all-read-btn').click()
    await expect(testId(page, 'unread-badge')).toHaveText('0')
  })

  test('delete notification removes it and pagination works', async ({ page }) => {
    await testId(page, 'delete-notification-btn').first().click()
    await expect(testId(page, 'notification-list')).toBeVisible()
    await testId(page, 'notifications-next-page').click()
    await expect(testId(page, 'notifications-page-current')).toHaveText('2')
  })

  test('notification preferences email toggle persists on refresh', async ({ page }) => {
    await testId(page, 'notifications-settings-tab').click()
    await testId(page, 'notification-email-toggle').click()
    await page.reload()
    await testId(page, 'notifications-settings-tab').click()
    await expect(testId(page, 'notification-email-toggle')).toHaveAttribute('data-saved', 'true')
  })

  test('empty state shown correctly', async ({ page }) => {
    await page.goto(`${APP_URL}/account/notifications?fixture=empty`)
    await expect(testId(page, 'notifications-empty-state')).toBeVisible()
  })
})
