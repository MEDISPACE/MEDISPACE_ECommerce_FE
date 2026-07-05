import { expect, test } from '@playwright/test'
import { drugDatabaseCategories } from '../fixtures/categories'
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

test('filter bar controls category, rx/otc, stock, combinations, and clear', async ({ page }) => {
  await screenshot(page, 'filter-bar', 'all filters', '01-initial')
  await page.click('[data-testid="category-filter"]')
  await screenshot(page, 'filter-bar', 'all filters', '02-category-open')
  await page.getByRole('option', { name: drugDatabaseCategories[0].name }).click()
  await expect(page.locator('[data-testid="product-card"]').first()).toHaveAttribute('data-category-id', drugDatabaseCategories[0]._id)
  await screenshot(page, 'filter-bar', 'all filters', '03-category-filtered')

  await page.click('[data-testid="rxtype-filter-rx"]')
  await expect(page.locator('[data-testid="rx-badge"]').first()).toContainText('Rx')
  await screenshot(page, 'filter-bar', 'all filters', '04-rx-filtered')

  await page.click('[data-testid="rxtype-filter-otc"]')
  await expect(page.locator('[data-testid="rx-badge"]').first()).toContainText('OTC')
  await screenshot(page, 'filter-bar', 'all filters', '05-otc-filtered')

  await page.click('[data-testid="clear-filters-btn"]')
  await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible()
  await page.click('[data-testid="stock-filter"]')
  await page.getByRole('option', { name: 'Sắp hết hàng', exact: true }).click()
  await expect(page.locator('[data-testid="low-stock-badge"]').first()).toBeVisible()
  await screenshot(page, 'filter-bar', 'all filters', '06-low-stock-filtered')

  await expect(page.locator('[data-testid="active-filter-chips"]')).toContainText('Tồn kho')
  await screenshot(page, 'filter-bar', 'all filters', '07-active-chips-url')
  expect(page.url()).toContain('stock=lowStock')

  await page.click('[data-testid="clear-filters-btn"]')
  await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible()
  await screenshot(page, 'filter-bar', 'all filters', '08-cleared')
})
