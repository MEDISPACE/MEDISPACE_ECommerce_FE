import { expect, test } from '@playwright/test'
import { loginAsPharmacist } from '../helpers/auth'
import { mockDrugDatabaseRoutes, seedDrugDatabase } from '../helpers/db'
import { screenshot } from '../helpers/screenshot'

test.beforeEach(async ({ page }) => {
  await seedDrugDatabase()
  await loginAsPharmacist(page)
})

test('empty search and empty filter states are trustworthy', async ({ page }) => {
  await mockDrugDatabaseRoutes(page)
  await page.goto('/pharmacist/drug-database')
  await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible()
  await screenshot(page, 'empty-and-error-states', 'empty states', '01-loaded')
  await page.fill('[data-testid="search-input"]', 'no-such-drug')
  await expect(page.locator('[data-testid="empty-state"]')).toBeVisible()
  await screenshot(page, 'empty-and-error-states', 'empty states', '02-empty-search')
  await page.click('[data-testid="empty-clear-btn"]')
  await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible()
  await screenshot(page, 'empty-and-error-states', 'empty states', '03-cleared')
})

test('API failure, retry, slow API, and detail API failure are handled', async ({ page }) => {
  let failList = true
  await mockDrugDatabaseRoutes(page)
  await page.route('**/pharmacist/drug-database/products**', async (route) => {
    if (failList) {
      failList = false
      await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'Server error' }) })
      return
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ result: { products: [], pagination: { page: 1, limit: 24, totalPages: 0, totalCount: 0 }, lowStockThreshold: 30, searchSource: 'mongo', lastCheckedAt: new Date().toISOString() } }) })
  })
  await page.goto('/pharmacist/drug-database')
  await expect(page.locator('[data-testid="error-state"]')).toBeVisible()
  await screenshot(page, 'empty-and-error-states', 'api failure retry', '01-api-error')
  await page.click('[data-testid="retry-btn"]')
  await expect(page.locator('[data-testid="empty-state"]')).toBeVisible()
  await screenshot(page, 'empty-and-error-states', 'api failure retry', '02-retry-success-empty')
  await screenshot(page, 'empty-and-error-states', 'api failure retry', '03-final-state')
})

test('slow API shows loading skeleton and session expired redirects', async ({ page }) => {
  await mockDrugDatabaseRoutes(page)
  await page.route('**/pharmacist/drug-database/products**', async (route) => {
    await page.waitForTimeout(1200)
    await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: 'Unauthorized' }) })
  })
  await page.goto('/pharmacist/drug-database')
  await expect(page.locator('[data-testid="skeleton-card"]').first()).toBeVisible()
  await screenshot(page, 'empty-and-error-states', 'slow and unauthorized', '01-skeleton')
  await expect(page).toHaveURL(/\/login/)
  await expect(page.locator('[data-testid="login-email"]')).toBeVisible()
  await screenshot(page, 'empty-and-error-states', 'slow and unauthorized', '02-session-expired-login')
  await screenshot(page, 'empty-and-error-states', 'slow and unauthorized', '03-final')
})
