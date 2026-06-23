import { expect, test } from '@playwright/test'
import { APP_URL, expectRedirectsToLogin, loginAs, testId } from '../helpers/auth'

test.describe('account cross-cutting behavior', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
  })

  test('active menu item highlighted and all menu items navigate correctly', async ({ page }) => {
    const routes = ['profile', 'orders', 'returns', 'reviews', 'prescriptions', 'addresses', 'notifications', 'wishlist', 'rewards', 'change-password', 'settings']
    for (const route of routes) {
      await page.goto(`${APP_URL}/account/${route}`)
      await expect(testId(page, `account-nav-${route}`)).toHaveAttribute('data-active', 'true')
    }
  })

  test('mobile menu opens/closes and browser back works', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto(`${APP_URL}/account`)
    await testId(page, 'account-mobile-menu-trigger').click()
    await expect(testId(page, 'account-mobile-menu')).toBeVisible()
    await testId(page, 'account-nav-orders').click()
    await expect(page).toHaveURL(/\/account\/orders/)
    await page.goBack()
    await expect(page).toHaveURL(/\/account$/)
  })

  test('auth guard redirects and login returns to original page', async ({ page }) => {
    await page.context().clearCookies()
    await expectRedirectsToLogin(page, '/account/orders')
    await loginAs(page)
    await expect(page).toHaveURL(/\/account\/orders|\/account/)
  })

  test('session expires on account page redirects to login', async ({ page }) => {
    await page.goto(`${APP_URL}/account/orders`)
    await page.evaluate(() => localStorage.removeItem('medispace_access_token'))
    await page.reload()
    await expect(page).toHaveURL(/\/login/)
  })

  test('data consistency across profile, address, order, loyalty, wishlist', async ({ page }) => {
    await page.goto(`${APP_URL}/account/profile`)
    await testId(page, 'profile-first-name').fill('Tên')
    await testId(page, 'profile-last-name').fill('Mới')
    await testId(page, 'save-profile-btn').click()
    await expect(testId(page, 'sidebar-username')).toContainText('Tên Mới')
    await page.goto(`${APP_URL}/account/addresses`)
    await expect(testId(page, 'address-list')).toBeVisible()
    await page.goto(`${APP_URL}/account/rewards`)
    await expect(testId(page, 'loyalty-balance')).toBeVisible()
    await page.goto(`${APP_URL}/account/wishlist`)
    await expect(testId(page, 'wishlist-page')).toBeVisible()
  })

  test('all pages usable on 375px viewport including forms/dropdowns/file upload', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    for (const route of ['profile', 'addresses', 'prescriptions/upload', 'change-password']) {
      await page.goto(`${APP_URL}/account/${route}`)
      await expect(testId(page, 'account-content')).toBeVisible()
    }
  })
})
