import { expect, test } from '@playwright/test'
import { APP_URL, loginAs, testId } from '../helpers/auth'

test.describe('account payment methods', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
    await page.goto(`${APP_URL}/account/payment-methods`)
  })

  test('page never shows raw card or CVV form inside MediSpace', async ({ page }) => {
    await expect(testId(page, 'payment-methods-page')).toBeVisible()
    await expect(page.locator('input[name="cardNumber"]')).toHaveCount(0)
    await expect(page.locator('input[name="cvv"]')).toHaveCount(0)
  })

  test('safe checkout payment explanation is shown', async ({ page }) => {
    await expect(testId(page, 'payment-tokenization-notice')).toContainText('không thu hoặc lưu')
  })

  test('checkout action navigates to checkout', async ({ page }) => {
    await testId(page, 'payment-checkout-link').click()
    await expect(page).toHaveURL(/\/cart\/checkout/)
  })

  test('sensitive card data is never shown in full', async ({ page }) => {
    await expect(page.locator('body')).not.toContainText(/\d{13,19}/)
  })
})
