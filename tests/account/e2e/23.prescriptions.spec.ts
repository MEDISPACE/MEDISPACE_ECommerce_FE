import { expect, test } from '@playwright/test'
import { APP_URL, loginAs, testId } from '../helpers/auth'
import { invalidTextFile, uploadFixtureFile, validImageFile } from '../helpers/upload'

test.describe('account prescriptions', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
  })

  test('prescription list loads real data and only current user data', async ({ page }) => {
    await page.goto(`${APP_URL}/account/prescriptions`)
    await expect(testId(page, 'prescriptions-page')).toBeVisible()
    await expect(testId(page, 'prescriptions-list')).not.toContainText('other-user')
  })

  test('upload prescription accepts file and invalid type is rejected', async ({ page }) => {
    await page.goto(`${APP_URL}/account/prescriptions/upload`)
    await expect(testId(page, 'prescription-upload-form')).toBeVisible()
    await uploadFixtureFile(page, 'prescription-file-input', validImageFile)
    await expect(testId(page, 'prescription-preview')).toBeVisible()
    await uploadFixtureFile(page, 'prescription-file-input', invalidTextFile)
    await expect(testId(page, 'form-error')).toBeVisible()
  })

  test('uploaded prescription appears with pending status', async ({ page }) => {
    await page.goto(`${APP_URL}/account/prescriptions/upload`)
    await uploadFixtureFile(page, 'prescription-file-input', validImageFile)
    await testId(page, 'submit-prescription-btn').click()
    await page.goto(`${APP_URL}/account/prescriptions`)
    await expect(testId(page, 'prescriptions-list')).toContainText('Chờ duyệt')
  })

  test('approved and expired prescriptions are marked clearly', async ({ page }) => {
    await page.goto(`${APP_URL}/account/prescriptions`)
    await expect(testId(page, 'prescription-approved-badge')).toBeVisible()
    await expect(testId(page, 'prescription-expired-badge')).toBeVisible()
  })

  test('view prescription details are correct', async ({ page }) => {
    await page.goto(`${APP_URL}/account/prescriptions`)
    await testId(page, 'view-prescription-btn').first().click()
    await expect(testId(page, 'prescription-detail-dialog')).toBeVisible()
    await expect(testId(page, 'prescription-doctor')).toBeVisible()
    await expect(testId(page, 'prescription-items')).toBeVisible()
  })

  test('empty state when no prescriptions', async ({ page }) => {
    await page.goto(`${APP_URL}/account/prescriptions?fixture=empty`)
    await expect(testId(page, 'prescriptions-empty-state')).toBeVisible()
  })
})
