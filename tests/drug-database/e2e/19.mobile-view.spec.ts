import { expect, test } from '@playwright/test'
import { loginAsPharmacist } from '../helpers/auth'
import { mockDrugDatabaseRoutes, seedDrugDatabase } from '../helpers/db'
import { screenshot } from '../helpers/screenshot'

test.use({ viewport: { width: 375, height: 812 } })

test.beforeEach(async ({ page }) => {
  await seedDrugDatabase()
  await loginAsPharmacist(page)
  await mockDrugDatabaseRoutes(page)
  await page.goto('/pharmacist/drug-database')
  await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible()
})

test('mobile layout keeps search, filters, cards, detail, and pagination usable', async ({ page }) => {
  await screenshot(page, 'mobile-view', 'mobile workflow', '01-mobile-page')
  await page.focus('[data-testid="search-input"]')
  await page.fill('[data-testid="search-input"]', 'Vitamin')
  await expect(page.locator('[data-testid="product-name"]').first()).toContainText('Vitamin')
  await screenshot(page, 'mobile-view', 'mobile workflow', '02-search-focused')
  await expect(page.locator('[data-testid="filter-bar"]')).toBeVisible()
  await screenshot(page, 'mobile-view', 'mobile workflow', '03-filter-controls')
  await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible()
  await screenshot(page, 'mobile-view', 'mobile workflow', '04-single-column-cards')
  await page.locator('[data-testid="product-card"]').first().click()
  await expect(page.locator('[data-testid="product-detail"]')).toBeVisible()
  await screenshot(page, 'mobile-view', 'mobile workflow', '05-detail-mobile')
  await page.click('[data-testid="close-detail-btn"]')
  await expect(page.locator('[data-testid="pagination"]')).toBeVisible()
  await screenshot(page, 'mobile-view', 'mobile workflow', '06-pagination-mobile')
})
