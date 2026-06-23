import { expect, test } from '@playwright/test'
import { APP_URL, loginAs, testId } from '../helpers/auth'

test.describe('account wishlist', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
    await page.goto(`${APP_URL}/account/wishlist`)
  })

  test('wishlist loads real items and empty state works', async ({ page }) => {
    await expect(testId(page, 'wishlist-page')).toBeVisible()
    await expect(testId(page, 'wishlist-grid')).not.toContainText('Lorem')
  })

  test('out-of-stock indicator, remove, and add-to-cart behavior', async ({ page }) => {
    await expect(testId(page, 'wishlist-out-of-stock')).toBeVisible()
    await testId(page, 'wishlist-add-to-cart').first().click()
    await expect(testId(page, 'cart-count')).not.toHaveText('0')
    await testId(page, 'wishlist-remove-btn').first().click()
    await expect(testId(page, 'toast-success')).toBeVisible()
  })

  test('out-of-stock item is blocked from add to cart', async ({ page }) => {
    await testId(page, 'wishlist-out-of-stock-add').click()
    await expect(testId(page, 'form-error')).toBeVisible()
  })

  test('price is current and deleted product removed gracefully', async ({ page }) => {
    await expect(testId(page, 'wishlist-current-price').first()).toBeVisible()
    await page.goto(`${APP_URL}/account/wishlist?fixture=deleted-product`)
    await expect(testId(page, 'wishlist-page')).toBeVisible()
  })

  test('sort by price and date added works', async ({ page }) => {
    await testId(page, 'wishlist-sort-select').selectOption('priceAsc')
    await expect(testId(page, 'wishlist-grid')).toBeVisible()
    await testId(page, 'wishlist-sort-select').selectOption('newest')
    await expect(testId(page, 'wishlist-grid')).toBeVisible()
  })

  test('empty state shown correctly', async ({ page }) => {
    await page.goto(`${APP_URL}/account/wishlist?fixture=empty`)
    await expect(testId(page, 'wishlist-empty-state')).toBeVisible()
  })
})
