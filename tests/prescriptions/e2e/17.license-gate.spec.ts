import { test, expect } from '@playwright/test'
import { captureEvidence, cleanupPrescriptionData, getPrescriptionFromDb, getUserFromDb, newPharmacistPage, openPrescriptionPage, openReviewDialog, seedPrescriptionData, setPharmacistGate } from './helpers'

test.describe('prescriptions/e2e/17.license-gate', () => {
  test.afterEach(async () => cleanupPrescriptionData())

  test('unlicensed pharmacist can view list but cannot approve or reject', async ({ browser }) => {
    const data = await seedPrescriptionData()
    const page = await newPharmacistPage(browser, data.unlicensed)
    await openPrescriptionPage(page)
    await openReviewDialog(page, data.pending)
    await page.getByTestId('approve-btn').click()
    await page.getByTestId('confirm-action-btn').click()
    await expect(page.getByText(/Pharmacist does not have a license|giấy phép/i).first()).toBeVisible({ timeout: 15_000 })
    await captureEvidence(page, '17-01-unlicensed-blocked')
  })

  test('offline pharmacist is blocked, then can retry after reconnect without losing review session', async ({ browser }) => {
    const data = await seedPrescriptionData()
    const page = await newPharmacistPage(browser, data.offline)
    await openPrescriptionPage(page)
    await openReviewDialog(page, data.pending)
    await page.getByTestId('reject-btn').click()
    await page.getByTestId('pharmacist-notes-input').fill('Dược sĩ offline không được quyết định')

    // The app's socket connection can mark the pharmacist online during page load.
    // Flip the gate immediately before submitting to simulate a real disconnect.
    await setPharmacistGate(data.offline._id, { isOnline: false })
    await expect.poll(async () => (await getUserFromDb(data.offline._id))?.isOnline, { timeout: 10_000 }).toBe(false)

    await page.getByTestId('confirm-action-btn').click()
    await expect.poll(async () => (await getPrescriptionFromDb(data.pending._id))?.status, { timeout: 15_000 }).toBe('pending')
    await expect(page.getByText(/Không thể cập nhật|online|trực tuyến/i).first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByTestId('prescription-detail-dialog')).toBeVisible()
    await captureEvidence(page, '17-02-offline-blocked-session-kept')

    await setPharmacistGate(data.offline._id, { isOnline: true })
    await page.getByTestId('confirm-action-btn').click()
    await expect.poll(async () => (await getPrescriptionFromDb(data.pending._id))?.status, { timeout: 15_000 }).toBe('rejected')
    await expect(page.getByText(/Đơn thuốc đã bị từ chối/i).first()).toBeVisible({ timeout: 15_000 })
    await captureEvidence(page, '17-03-reconnect-retry-success')
  })
})
