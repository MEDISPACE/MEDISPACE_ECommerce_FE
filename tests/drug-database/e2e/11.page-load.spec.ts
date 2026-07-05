import { expect, test } from '@playwright/test'
import { loginAsPharmacist } from '../helpers/auth'
import { mockDrugDatabaseRoutes, seedDrugDatabase } from '../helpers/db'
import { screenshot } from '../helpers/screenshot'

test.beforeEach(async ({ page }) => {
  await seedDrugDatabase()
  await loginAsPharmacist(page)
  await mockDrugDatabaseRoutes(page)
})

test('drug database page loads correctly', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (message) => message.type() === 'error' && consoleErrors.push(message.text()))
  await page.goto('/pharmacist/drug-database')
  await screenshot(page, 'page-load', 'drug database page loads correctly', '01-loading')
  await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible({ timeout: 10000 })
  await screenshot(page, 'page-load', 'drug database page loads correctly', '02-loaded')
  await expect(page.locator('[data-testid="search-input"]')).toBeVisible()
  await expect(page.locator('[data-testid="filter-bar"]')).toBeVisible()
  await expect(page.locator('[data-testid="total-count"]')).toBeVisible()
  await page.locator('[data-testid="search-input"]').focus()
  await screenshot(page, 'page-load', 'drug database page loads correctly', '03-search-focused')
  expect(await page.locator('[data-testid="product-card"]').count()).toBeGreaterThan(0)
  expect(
    consoleErrors.filter(
      (error) =>
        !error.includes('WebSocket connection') &&
        !error.includes('net::ERR_CONNECTION_REFUSED') &&
        !error.includes('net::ERR_NAME_NOT_RESOLVED'),
    ),
  ).toHaveLength(0)
})
