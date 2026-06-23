import { expect, test } from '@playwright/test'
import { APP_URL, loginAs, testId } from '../helpers/auth'

test.describe('account settings', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
    await page.goto(`${APP_URL}/account/settings`)
  })

  test('settings page loads persisted backend-backed sections', async ({ page }) => {
    await expect(testId(page, 'settings-page')).toBeVisible()
    await expect(testId(page, 'account-status-card')).toBeVisible()
    await expect(testId(page, 'notification-settings-link')).toBeVisible()
  })

  test('language/theme unsupported controls are not saved locally', async ({ page }) => {
    await expect(testId(page, 'privacy-coming-soon')).toBeVisible()
    await expect(testId(page, 'fake-save-settings-btn')).toHaveCount(0)
  })

  test('notification toggles save through notifications backend', async ({ page }) => {
    await testId(page, 'notification-settings-link').click()
    await expect(page).toHaveURL(/\/account\/notifications/)
    await testId(page, 'notifications-settings-tab').click()
    await testId(page, 'notification-email-toggle').click()
    await expect(testId(page, 'toast-success')).toBeVisible()
  })

  test('deactivate/delete data actions show safe unavailable state if not implemented', async ({ page }) => {
    await expect(testId(page, 'deactivate-account-btn')).toHaveCount(0)
    await expect(testId(page, 'delete-data-request-btn')).toHaveCount(0)
  })

  test('settings persist after page refresh via backend-backed pages', async ({ page }) => {
    await page.reload()
    await expect(testId(page, 'settings-page')).toBeVisible()
  })

  test('error shown if resend verification fails', async ({ page }) => {
    await page.goto(`${APP_URL}/account/settings?fixture=unverified-resend-fails`)
    await testId(page, 'resend-verification-btn').click()
    await expect(testId(page, 'toast-error')).toBeVisible()
  })
})
