import { expect, test } from '@playwright/test'
import { loginAsPharmacist } from '../helpers/auth'
import { mockDrugDatabaseRoutes, seedDrugDatabase } from '../helpers/db'
import { screenshot } from '../helpers/screenshot'

test.beforeEach(async ({ page }) => {
  await seedDrugDatabase()
  await loginAsPharmacist(page)
  await mockDrugDatabaseRoutes(page)
  await page.goto('/pharmacist/drug-database')
  await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible()
})

test('product detail view exposes all sections and closes cleanly', async ({ page }) => {
  await screenshot(page, 'product-detail-view', 'detail workflow', '01-before-open')
  await page.locator('[data-testid="product-card"]').first().click()
  await expect(page.locator('[data-testid="product-detail"]')).toBeVisible()
  await screenshot(page, 'product-detail-view', 'detail workflow', '02-detail-open')

  await expect(page.locator('[data-testid="medical-info-section"]')).toBeVisible()
  await expect(page.locator('[data-testid="last-updated"]')).toBeVisible()
  await screenshot(page, 'product-detail-view', 'detail workflow', '03-basic-medical-info')

  await page.click('[data-testid="tab-warnings"]')
  await expect(page.locator('[data-testid="warnings-section"]')).toBeVisible()
  await screenshot(page, 'product-detail-view', 'detail workflow', '04-warnings')

  await page.click('[data-testid="tab-pricing"]')
  await expect(page.locator('[data-testid="price-variant"]').first()).toBeVisible()
  await screenshot(page, 'product-detail-view', 'detail workflow', '05-pricing-variants')

  await page.click('[data-testid="tab-stock"]')
  await expect(page.locator('[data-testid="stock-section"]')).toBeVisible()
  await screenshot(page, 'product-detail-view', 'detail workflow', '06-stock')

  await page.click('[data-testid="close-detail-btn"]')
  await expect(page.locator('[data-testid="product-detail"]')).not.toBeVisible()
  await screenshot(page, 'product-detail-view', 'detail workflow', '07-back-to-list')
})

test('Rx detail warning and incomplete data fallback are visible', async ({ page }) => {
  await page.click('[data-testid="rxtype-filter-rx"]')
  await screenshot(page, 'product-detail-view', 'rx incomplete', '01-rx-list')
  await page.locator('[data-testid="product-card"]').first().click()
  await expect(page.locator('[data-testid="rx-warning"]')).toBeVisible()
  await screenshot(page, 'product-detail-view', 'rx incomplete', '02-rx-warning')
  await page.click('[data-testid="close-detail-btn"]')
  await page.click('[data-testid="clear-filters-btn"]')
  await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible()
  await page.fill('[data-testid="search-input"]', 'Incomplete')
  await expect(page.locator('[data-testid="product-card"]')).toHaveCount(1)
  await expect(page.locator('[data-testid="product-name"]').first()).toContainText('Incomplete')
  await page.locator('[data-testid="product-card"]').first().click()
  await expect(page.locator('[data-testid="data-quality-warning"]')).toBeVisible()
  await screenshot(page, 'product-detail-view', 'rx incomplete', '03-incomplete-fallback')
})
