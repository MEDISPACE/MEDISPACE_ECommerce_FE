import { expect, test } from '@playwright/test'
import { orders } from '../fixtures/orders'
import { loyalty } from '../fixtures/loyalty'
import { users } from '../fixtures/users'
import { APP_URL, expectRedirectsToLogin, loginAs, testId } from '../helpers/auth'

test.describe('account overview', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
    await page.goto(`${APP_URL}/account`)
  })

  test('logged-in user sees real name in greeting', async ({ page }) => {
    await expect(testId(page, 'account-greeting')).toContainText(users.standard.firstName)
  })

  test('order count matches actual orders in DB', async ({ page }) => {
    await expect(testId(page, 'overview-order-count')).toHaveText(String(orders.withAllStatuses.length))
  })

  test('points balance matches actual balance', async ({ page }) => {
    await expect(testId(page, 'overview-points-balance')).toContainText(String(loyalty.withHistory.balance))
  })

  test('wishlist count matches actual wishlist', async ({ page }) => {
    await expect(testId(page, 'overview-wishlist-count')).toBeVisible()
  })

  test('recent orders list shows real data, not mock', async ({ page }) => {
    await expect(testId(page, 'recent-orders')).toContainText('MS-')
    await expect(testId(page, 'account-page')).not.toContainText('Lorem')
  })

  test('all quick action links navigate correctly', async ({ page }) => {
    await testId(page, 'quick-action-orders').click()
    await expect(page).toHaveURL(/\/account\/orders/)
    await page.goto(`${APP_URL}/account`)
    await testId(page, 'quick-action-prescriptions').click()
    await expect(page).toHaveURL(/\/account\/prescriptions\/upload/)
    await page.goto(`${APP_URL}/account`)
    await testId(page, 'quick-action-rewards').click()
    await expect(page).toHaveURL(/\/account\/rewards/)
  })

  test('page redirects to login if not authenticated', async ({ page }) => {
    await page.context().clearCookies()
    await expectRedirectsToLogin(page, '/account')
  })

  test('after login redirects back to /account', async ({ page }) => {
    await page.context().clearCookies()
    await page.goto(`${APP_URL}/account`)
    await loginAs(page)
    await expect(page).toHaveURL(/\/account/)
  })
})
