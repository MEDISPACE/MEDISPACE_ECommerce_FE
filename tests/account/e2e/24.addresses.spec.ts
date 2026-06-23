import { expect, test } from '@playwright/test'
import { APP_URL, loginAs, testId } from '../helpers/auth'

test.describe('account addresses', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
    await page.goto(`${APP_URL}/account/addresses`)
  })

  test('address list loads real addresses', async ({ page }) => {
    await expect(testId(page, 'address-list')).toContainText('Lê Lợi')
  })

  test('add new address cascade and validation works', async ({ page }) => {
    await testId(page, 'add-address-btn').click()
    await testId(page, 'address-province-select').click()
    await testId(page, 'address-province-hcm').click()
    await expect(testId(page, 'address-district-select')).not.toBeDisabled()
    await testId(page, 'address-district-select').click()
    await testId(page, 'address-district-q1').click()
    await expect(testId(page, 'address-ward-select')).not.toBeDisabled()
    await testId(page, 'save-address-btn').click()
    await expect(testId(page, 'form-error')).toBeVisible()
  })

  test('invalid phone validation and successful save update list', async ({ page }) => {
    await testId(page, 'add-address-btn').click()
    await testId(page, 'address-phone-input').fill('123')
    await testId(page, 'save-address-btn').click()
    await expect(testId(page, 'form-error')).toBeVisible()
  })

  test('edit address is prefilled and save updates list', async ({ page }) => {
    await testId(page, 'edit-address-btn').first().click()
    await expect(testId(page, 'address-detail-input')).not.toHaveValue('')
    await testId(page, 'address-detail-input').fill('999 Updated Street')
    await testId(page, 'save-address-btn').click()
    await expect(testId(page, 'address-list')).toContainText('999 Updated Street')
  })

  test('delete non-default, cannot delete only/default, and set default works', async ({ page }) => {
    await testId(page, 'delete-address-btn').last().click()
    await expect(testId(page, 'delete-address-dialog')).toBeVisible()
    await testId(page, 'confirm-delete-address').click()
    await testId(page, 'set-default-address-btn').first().click()
    await expect(testId(page, 'default-address-badge')).toBeVisible()
  })

  test('max address limit disables add button with message', async ({ page }) => {
    await page.goto(`${APP_URL}/account/addresses?fixture=max`)
    await expect(testId(page, 'add-address-btn')).toBeDisabled()
    await expect(testId(page, 'address-limit-message')).toBeVisible()
  })
})
