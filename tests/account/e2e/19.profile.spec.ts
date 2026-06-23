import { expect, test } from '@playwright/test'
import { users } from '../fixtures/users'
import { APP_URL, loginAs, testId } from '../helpers/auth'
import { invalidTextFile, uploadFixtureFile, validImageFile } from '../helpers/upload'

test.describe('account profile', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
    await page.goto(`${APP_URL}/account/profile`)
  })

  test('page loads with real user data pre-filled', async ({ page }) => {
    await expect(testId(page, 'profile-first-name')).toHaveValue(users.standard.firstName)
  })

  test('user updates name and header immediately reflects it', async ({ page }) => {
    await testId(page, 'profile-first-name').fill('Tên')
    await testId(page, 'profile-last-name').fill('Mới')
    await testId(page, 'save-profile-btn').click()
    await expect(testId(page, 'sidebar-username')).toContainText('Tên Mới')
  })

  test('user updates phone and save succeeds', async ({ page }) => {
    await testId(page, 'profile-phone').fill('0909999999')
    await testId(page, 'save-profile-btn').click()
    await expect(testId(page, 'toast-success')).toBeVisible()
  })

  test('user uploads avatar and preview is shown', async ({ page }) => {
    await uploadFixtureFile(page, 'avatar-upload-input', validImageFile)
    await expect(testId(page, 'avatar-preview')).toBeVisible()
  })

  test('upload invalid file type shows error', async ({ page }) => {
    await uploadFixtureFile(page, 'avatar-upload-input', invalidTextFile)
    await expect(testId(page, 'form-error')).toBeVisible()
  })

  test('upload oversized file shows error', async ({ page }) => {
    await uploadFixtureFile(page, 'avatar-upload-input', { ...validImageFile, buffer: Buffer.alloc(6 * 1024 * 1024) })
    await expect(testId(page, 'form-error')).toBeVisible()
  })

  test('submit with empty name shows validation error', async ({ page }) => {
    await testId(page, 'profile-first-name').fill('')
    await testId(page, 'save-profile-btn').click()
    await expect(testId(page, 'form-error')).toBeVisible()
  })

  test('submit with invalid email shows validation error', async ({ page }) => {
    await testId(page, 'profile-email').fill('bad-email')
    await testId(page, 'save-profile-btn').click()
    await expect(testId(page, 'form-error')).toBeVisible()
  })

  test('success toast shown after save', async ({ page }) => {
    await testId(page, 'save-profile-btn').click()
    await expect(testId(page, 'toast-success')).toBeVisible()
  })
})
