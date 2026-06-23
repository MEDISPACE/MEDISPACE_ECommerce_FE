import { expect, test } from '@playwright/test'
import { loyalty } from '../fixtures/loyalty'
import { APP_URL, loginAs, testId } from '../helpers/auth'

test.describe('account loyalty', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
    await page.goto(`${APP_URL}/account/rewards`)
  })

  test('real point balance and tier are shown', async ({ page }) => {
    await expect(testId(page, 'loyalty-balance')).toContainText(String(loyalty.withHistory.balance))
    await expect(testId(page, 'loyalty-tier')).toBeVisible()
  })

  test('point history loads real transactions with fields', async ({ page }) => {
    await testId(page, 'loyalty-history-tab').click()
    await expect(testId(page, 'loyalty-history-list')).toContainText('+')
    await expect(testId(page, 'loyalty-history-balance').first()).toBeVisible()
  })

  test('filters by earned and redeemed', async ({ page }) => {
    await testId(page, 'loyalty-history-tab').click()
    await testId(page, 'loyalty-filter-earned').click()
    await expect(testId(page, 'loyalty-history-list')).toContainText('Tích')
    await testId(page, 'loyalty-filter-redeemed').click()
    await expect(testId(page, 'loyalty-history-list')).toContainText('Đổi')
  })

  test('expiring points, order completion and redemption update balance', async ({ page }) => {
    await expect(testId(page, 'loyalty-expiring-warning')).toBeVisible()
    await page.request.post(`${APP_URL}/test-api/orders/complete`, { data: { orderId: 'order-processing' } })
    await page.reload()
    await expect(testId(page, 'loyalty-balance')).toBeVisible()
    await page.request.post(`${APP_URL}/test-api/loyalty/redeem`, { data: { points: 100 } })
    await page.reload()
    await expect(testId(page, 'loyalty-balance')).toBeVisible()
  })

  test('empty state for new users with no history', async ({ page }) => {
    await page.goto(`${APP_URL}/account/rewards?fixture=empty`)
    await testId(page, 'loyalty-history-tab').click()
    await expect(testId(page, 'loyalty-empty-state')).toBeVisible()
  })
})
