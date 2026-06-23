import { expect, test } from '@playwright/test'
import { APP_URL, loginAs, testId } from '../helpers/auth'
import { invalidTextFile, uploadFixtureFile, validImageFile } from '../helpers/upload'

test.describe('account returns', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
  })

  test('return list loads real requests and empty state works', async ({ page }) => {
    await page.goto(`${APP_URL}/account/returns`)
    await expect(testId(page, 'returns-page')).toBeVisible()
  })

  test('return button shown only for eligible delivered orders', async ({ page }) => {
    await page.goto(`${APP_URL}/account/orders`)
    await testId(page, 'order-delivered').first().click()
    await expect(testId(page, 'create-return-btn')).toBeVisible()
  })

  test('submit return form with all fields creates request', async ({ page }) => {
    await page.goto(`${APP_URL}/account/orders/order-delivered/return`)
    await testId(page, 'return-item-checkbox').first().check()
    await testId(page, 'return-reason-select').click()
    await testId(page, 'return-reason-defective').click()
    await testId(page, 'return-detail-input').fill('Sản phẩm bị lỗi khi nhận hàng')
    await uploadFixtureFile(page, 'evidence-upload', validImageFile)
    await testId(page, 'submit-return-btn').click()
    await expect(page).toHaveURL(/\/account\/returns/)
  })

  test('submit without reason or invalid quantity shows validation error', async ({ page }) => {
    await page.goto(`${APP_URL}/account/orders/order-delivered/return`)
    await testId(page, 'submit-return-btn').click()
    await expect(testId(page, 'form-error')).toBeVisible()
  })

  test('upload photo preview and invalid file error work', async ({ page }) => {
    await page.goto(`${APP_URL}/account/orders/order-delivered/return`)
    await uploadFixtureFile(page, 'evidence-upload', validImageFile)
    await expect(testId(page, 'evidence-preview')).toBeVisible()
    await uploadFixtureFile(page, 'evidence-upload', invalidTextFile)
    await expect(testId(page, 'form-error')).toBeVisible()
  })

  test('cannot submit return for out-of-window order', async ({ page }) => {
    await page.goto(`${APP_URL}/account/orders/order-outside-return-window/return`)
    await expect(testId(page, 'submit-return-btn')).toBeDisabled()
  })
})
