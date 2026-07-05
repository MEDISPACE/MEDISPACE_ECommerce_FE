import { expect, test } from '@playwright/test'
import { drugDatabaseProducts } from '../fixtures/products'
import { loginAsPharmacist } from '../helpers/auth'
import { mockDrugDatabaseRoutes, seedDrugDatabase } from '../helpers/db'
import { screenshot } from '../helpers/screenshot'

test.beforeEach(async ({ page }) => {
  await seedDrugDatabase()
  await loginAsPharmacist(page)
  const manyProducts = Array.from({ length: 30 }, (_, index) => ({ ...drugDatabaseProducts[index % 4], _id: `65f300000000000000001${String(index).padStart(3, '0')}`, name: `${drugDatabaseProducts[index % 4].name} ${index}` }))
  await mockDrugDatabaseRoutes(page, manyProducts)
})

test('pagination controls page 1, page 2, and last page', async ({ page }) => {
  await page.goto('/pharmacist/drug-database')
  await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible()
  await expect(page.locator('[data-testid="prev-page-btn"]')).toBeDisabled()
  await screenshot(page, 'pagination', 'pagination controls', '01-page-1')

  const firstPageName = await page.locator('[data-testid="product-name"]').first().textContent()
  await page.click('[data-testid="next-page-btn"]')
  await expect(page.locator('[data-testid="page-indicator"]')).toContainText('Trang 2')
  const secondPageName = await page.locator('[data-testid="product-name"]').first().textContent()
  expect(secondPageName).not.toBe(firstPageName)
  await screenshot(page, 'pagination', 'pagination controls', '02-page-2')

  await page.goto('/pharmacist/drug-database?page=2')
  await expect(page.locator('[data-testid="page-indicator"]')).toContainText('Trang 2')
  await screenshot(page, 'pagination', 'pagination controls', '03-direct-url-page-2')
})
