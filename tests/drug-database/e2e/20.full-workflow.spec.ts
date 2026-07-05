import { expect, test } from '@playwright/test'
import { loginAsPharmacist } from '../helpers/auth'
import { mockDrugDatabaseRoutes, seedDrugDatabase } from '../helpers/db'
import { screenshot } from '../helpers/screenshot'

test.beforeEach(async ({ page }) => {
  await seedDrugDatabase()
  await loginAsPharmacist(page)
  await mockDrugDatabaseRoutes(page)
})

test('complete pharmacist consultation lookup workflow', async ({ page }) => {
  await page.goto('/pharmacist/drug-database')
  await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible()
  await screenshot(page, 'full-workflow', 'complete pharmacist consultation lookup workflow', '01-initial')

  await page.fill('[data-testid="search-input"]', 'Amoxicillin')
  await expect(page.locator('[data-testid="product-name"]').first()).toContainText('Amoxicillin')
  await screenshot(page, 'full-workflow', 'complete pharmacist consultation lookup workflow', '02-search-results')

  await page.click('[data-testid="rxtype-filter-rx"]')
  await expect(page.locator('[data-testid="rx-badge"]').first()).toContainText('Rx')
  await screenshot(page, 'full-workflow', 'complete pharmacist consultation lookup workflow', '03-rx-filter-applied')

  await page.locator('[data-testid="product-card"]').first().click()
  await expect(page.locator('[data-testid="product-detail"]')).toBeVisible()
  await screenshot(page, 'full-workflow', 'complete pharmacist consultation lookup workflow', '04-detail-open')

  await page.click('[data-testid="tab-medical-info"]')
  await expect(page.locator('[data-testid="medical-info-section"]')).toBeVisible()
  await screenshot(page, 'full-workflow', 'complete pharmacist consultation lookup workflow', '05-medical-info')

  await page.click('[data-testid="tab-warnings"]')
  await expect(page.locator('[data-testid="warnings-section"]')).toBeVisible()
  await screenshot(page, 'full-workflow', 'complete pharmacist consultation lookup workflow', '06-warnings')

  await page.click('[data-testid="tab-pricing"]')
  await expect(page.locator('[data-testid="pricing-section"]')).toBeVisible()
  await screenshot(page, 'full-workflow', 'complete pharmacist consultation lookup workflow', '07-pricing')

  await page.click('[data-testid="tab-stock"]')
  await expect(page.locator('[data-testid="stock-section"]')).toBeVisible()
  await screenshot(page, 'full-workflow', 'complete pharmacist consultation lookup workflow', '08-stock')

  await page.click('[data-testid="close-detail-btn"]')
  await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible()
  await screenshot(page, 'full-workflow', 'complete pharmacist consultation lookup workflow', '09-back-to-list')

  await page.click('[data-testid="clear-search-btn"]')
  await page.click('[data-testid="clear-filters-btn"]')
  await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible()
  await screenshot(page, 'full-workflow', 'complete pharmacist consultation lookup workflow', '10-cleared')
})
