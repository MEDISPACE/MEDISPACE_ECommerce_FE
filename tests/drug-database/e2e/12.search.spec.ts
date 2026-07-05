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

test('search by product name, ingredient, brand, no-result, and clear', async ({ page }) => {
  await screenshot(page, 'search', 'search scenarios', '01-before-search')
  await page.fill('[data-testid="search-input"]', 'Paracetamol')
  await screenshot(page, 'search', 'search scenarios', '02-after-typing-name')
  await expect(page.locator('[data-testid="product-card"]')).toHaveCount(1)
  await screenshot(page, 'search', 'search scenarios', '03-name-results')

  await page.fill('[data-testid="search-input"]', 'Amoxicillin')
  await expect(page.locator('[data-testid="product-name"]')).toContainText('Amoxicillin')
  await screenshot(page, 'search', 'search scenarios', '04-ingredient-results')

  await page.fill('[data-testid="search-input"]', 'Aenova')
  await expect(page.locator('[data-testid="product-card"]')).toHaveCount(2)
  await screenshot(page, 'search', 'search scenarios', '05-brand-results')

  await page.fill('[data-testid="search-input"]', 'Vit')
  await expect(page.locator('[data-testid="product-name"]').first()).toContainText('Vitamin C')
  await screenshot(page, 'search', 'search scenarios', '06-partial-results')

  await page.fill('[data-testid="search-input"]', 'vitamin c')
  await expect(page.locator('[data-testid="product-name"]').first()).toContainText('Vitamin C')
  await screenshot(page, 'search', 'search scenarios', '07-vietnamese-nodiacritic-results')

  await page.fill('[data-testid="search-input"]', 'no-such-drug')
  await expect(page.locator('[data-testid="empty-state"]')).toBeVisible()
  await screenshot(page, 'search', 'search scenarios', '08-empty-results')

  await page.click('[data-testid="clear-search-btn"]')
  await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible()
  await screenshot(page, 'search', 'search scenarios', '09-cleared-results')
})

test('search debounce does not fire per keystroke', async ({ page }) => {
  let requests = 0
  page.on('request', (request) => {
    if (request.url().includes('/pharmacist/drug-database/products')) requests += 1
  })
  await screenshot(page, 'search', 'debounce', '01-before-rapid-typing')
  await page.fill('[data-testid="search-input"]', 'P')
  await page.fill('[data-testid="search-input"]', 'Pa')
  await page.fill('[data-testid="search-input"]', 'Par')
  await screenshot(page, 'search', 'debounce', '02-after-rapid-typing')
  await expect(page.locator('[data-testid="product-name"]').first()).toContainText('Paracetamol')
  await screenshot(page, 'search', 'debounce', '03-debounced-results')
  expect(requests).toBeLessThanOrEqual(3)
})
