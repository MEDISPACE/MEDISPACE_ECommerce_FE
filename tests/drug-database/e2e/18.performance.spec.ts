import { expect, test } from '@playwright/test'
import { loginAsPharmacist } from '../helpers/auth'
import { mockDrugDatabaseRoutes, seedDrugDatabase } from '../helpers/db'
import { screenshot } from '../helpers/screenshot'

test.beforeEach(async ({ page }) => {
  await seedDrugDatabase()
  await loginAsPharmacist(page)
  await mockDrugDatabaseRoutes(page)
})

test('page, search, filter, detail, and pagination performance are within budget', async ({ page }) => {
  const start = Date.now()
  await page.goto('/pharmacist/drug-database')
  await page.locator('[data-testid="product-card"]').first().waitFor({ timeout: 3000 })
  const loadTime = Date.now() - start
  await screenshot(page, 'performance', 'timing budgets', `01-loaded-${loadTime}ms`)
  expect(loadTime).toBeLessThan(3000)

  const searchStart = Date.now()
  await page.fill('[data-testid="search-input"]', 'Paracetamol')
  await expect(page.locator('[data-testid="product-name"]').first()).toContainText('Paracetamol')
  const searchTime = Date.now() - searchStart
  await screenshot(page, 'performance', 'timing budgets', `02-search-${searchTime}ms`)
  expect(searchTime).toBeLessThan(1500)

  const filterStart = Date.now()
  await page.click('[data-testid="rxtype-filter-otc"]')
  await expect(page.locator('[data-testid="rx-badge"]').first()).toContainText('OTC')
  const filterTime = Date.now() - filterStart
  await screenshot(page, 'performance', 'timing budgets', `03-filter-${filterTime}ms`)
  expect(filterTime).toBeLessThan(1000)

  const detailStart = Date.now()
  await page.locator('[data-testid="product-card"]').first().click()
  await expect(page.locator('[data-testid="product-detail"]')).toBeVisible()
  const detailTime = Date.now() - detailStart
  await screenshot(page, 'performance', 'timing budgets', `04-detail-${detailTime}ms`)
  expect(detailTime).toBeLessThan(1000)
})
