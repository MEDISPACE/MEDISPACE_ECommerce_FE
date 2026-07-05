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

test('product list cards show all required states', async ({ page }) => {
  await screenshot(page, 'product-list-view', 'card states', '01-list-view')
  const first = page.locator('[data-testid="product-card"]').first()
  await expect(first.locator('[data-testid="product-name"]')).toBeVisible()
  await expect(first.locator('[data-testid="product-brand"]')).toBeVisible()
  await expect(first.locator('[data-testid="product-price"]')).toBeVisible()
  await expect(first.locator('[data-testid="product-unit"]')).toBeVisible()
  await expect(first.locator('[data-testid="stock-status"]')).toBeVisible()
  await screenshot(page, 'product-list-view', 'card states', '02-card-fields')

  await page.click('[data-testid="rxtype-filter-rx"]')
  await expect(page.locator('[data-testid="rx-badge"]').first()).toContainText('Rx')
  await screenshot(page, 'product-list-view', 'card states', '03-rx-card')

  await page.click('[data-testid="clear-filters-btn"]')
  await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible()
  await page.click('[data-testid="stock-filter"]')
  await page.getByRole('option', { name: 'Hết hàng', exact: true }).click()
  await expect(page.locator('[data-testid="out-stock-badge"]').first()).toBeVisible()
  await screenshot(page, 'product-list-view', 'card states', '04-out-of-stock-card')

  await page.click('[data-testid="stock-filter"]')
  await page.getByRole('option', { name: 'Sắp hết hàng', exact: true }).click()
  await expect(page.locator('[data-testid="low-stock-badge"]').first()).toBeVisible()
  await screenshot(page, 'product-list-view', 'card states', '05-low-stock-card')

  await page.locator('[data-testid="product-card"]').first().hover()
  await screenshot(page, 'product-list-view', 'card states', '06-hover-state')
})
