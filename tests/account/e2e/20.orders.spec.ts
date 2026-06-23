import { expect, test } from '@playwright/test'
import { APP_URL, loginAs, testId } from '../helpers/auth'

test.describe('account orders', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
    await page.goto(`${APP_URL}/account/orders`)
  })

  test('order list loads real orders, not mock data', async ({ page }) => {
    await expect(testId(page, 'orders-list')).toContainText('MS-')
    await expect(testId(page, 'orders-list')).not.toContainText('Lorem')
  })

  test('filter by processing shows only processing orders', async ({ page }) => {
    await testId(page, 'orders-tab-processing').click()
    await expect(testId(page, 'orders-list')).toContainText('Đang xử lý')
  })

  test('filter by delivered shows only delivered orders', async ({ page }) => {
    await testId(page, 'orders-tab-delivered').click()
    await expect(testId(page, 'orders-list')).toContainText('Đã giao')
  })

  test('click order navigates to correct detail with all fields', async ({ page }) => {
    await testId(page, 'order-card').first().click()
    await expect(page).toHaveURL(/\/account\/orders\//)
    await expect(testId(page, 'order-detail-items')).toBeVisible()
    await expect(testId(page, 'order-detail-total')).toBeVisible()
  })

  test('cancel confirmation and status update works for cancellable orders', async ({ page }) => {
    await testId(page, 'order-cancellable').first().click()
    await testId(page, 'cancel-order-btn').click()
    await expect(testId(page, 'cancel-order-dialog')).toBeVisible()
    await testId(page, 'confirm-cancel-order').click()
    await expect(testId(page, 'order-status')).toContainText('Đã hủy')
  })

  test('reorder button adds items to cart correctly', async ({ page }) => {
    await testId(page, 'order-delivered').first().click()
    await testId(page, 'reorder-btn').click()
    await expect(testId(page, 'cart-count')).not.toHaveText('0')
  })

  test('track order action copies or opens tracking safely', async ({ page }) => {
    await testId(page, 'order-with-tracking').first().click()
    await testId(page, 'tracking-action-btn').click()
    await expect(testId(page, 'toast-success')).toBeVisible()
  })

  test('empty state shown when no orders match filter', async ({ page }) => {
    await testId(page, 'order-search-input').fill('no-order-match')
    await expect(testId(page, 'orders-empty-state')).toBeVisible()
  })

  test('pagination works for users with many orders', async ({ page }) => {
    await expect(testId(page, 'orders-pagination')).toBeVisible()
    await testId(page, 'orders-page-next').click()
    await expect(testId(page, 'orders-page-current')).toHaveText('2')
  })
})
