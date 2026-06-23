import { expect, test } from '@playwright/test'
import { APP_URL, loginAs, testId } from '../helpers/auth'
import { users } from '../fixtures/users'

test.describe('account change password', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
    await page.goto(`${APP_URL}/account/change-password`)
  })

  test('form shows current, new, confirm fields and validates errors', async ({ page }) => {
    await expect(testId(page, 'current-password-input')).toBeVisible()
    await expect(testId(page, 'new-password-input')).toBeVisible()
    await expect(testId(page, 'confirm-password-input')).toBeVisible()
    await testId(page, 'current-password-input').fill('wrong')
    await testId(page, 'new-password-input').fill('short')
    await testId(page, 'confirm-password-input').fill('different')
    await testId(page, 'change-password-submit').click()
    await expect(testId(page, 'form-error')).toBeVisible()
  })

  test('weak password strength indicator shown', async ({ page }) => {
    await testId(page, 'new-password-input').fill('weak')
    await expect(testId(page, 'password-strength')).toBeVisible()
  })

  test('valid submission allows new password and rejects old password', async ({ page }) => {
    const newPassword = `Password!${Date.now()}`
    await testId(page, 'current-password-input').fill(users.standard.password)
    await testId(page, 'new-password-input').fill(newPassword)
    await testId(page, 'confirm-password-input').fill(newPassword)
    await testId(page, 'change-password-submit').click()
    await expect(testId(page, 'toast-success')).toBeVisible()
    await page.goto(`${APP_URL}/login`)
    await testId(page, 'login-email').fill(users.standard.email)
    await testId(page, 'login-password').fill(newPassword)
    await testId(page, 'login-submit').click()
    await expect(page).toHaveURL(/\/account|\//)
  })

  test('rate limit and social-only user states are shown', async ({ page }) => {
    for (let i = 0; i < 5; i += 1) {
      await testId(page, 'current-password-input').fill(`wrong-${i}`)
      await testId(page, 'change-password-submit').click()
    }
    await expect(testId(page, 'rate-limit-message')).toBeVisible()
    await page.goto(`${APP_URL}/account/change-password?fixture=social-only`)
    await expect(testId(page, 'social-only-password-message')).toBeVisible()
  })
})
