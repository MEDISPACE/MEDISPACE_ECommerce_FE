import { test, expect } from '@playwright/test'
import { captureEvidence, cleanupPrescriptionData, getPrescriptionFromDb, newPharmacistPage, openPrescriptionPage, openReviewDialog, seedPrescriptionData } from './helpers'

test.describe('prescriptions/e2e/15.reject-flow', () => {
  test.afterEach(async () => cleanupPrescriptionData())

  test('validates reject reason, rejects, persists reason, triggers notification path, and removes actions', async ({ browser }) => {
    const data = await seedPrescriptionData()
    const page = await newPharmacistPage(browser, data.pharmacist)
    await openPrescriptionPage(page)
    await openReviewDialog(page, data.pending)

    await page.getByTestId('reject-btn').click()
    await page.getByTestId('confirm-action-btn').click()
    await expect(page.getByText(/Vui lòng nhập lý do từ chối/i)).toBeVisible()
    await captureEvidence(page, '15-01-reject-validation')
    await page.getByTestId('pharmacist-notes-input').fill('Ảnh đơn thuốc bị mờ, không đọc được liều lượng')
    await page.getByTestId('confirm-action-btn').click()
    await expect.poll(async () => (await getPrescriptionFromDb(data.pending._id))?.status, { timeout: 15_000 }).toBe('rejected')
    await expect(page.getByTestId(`prescription-card-${data.pending._id}`)).toContainText(/Từ chối|Đã từ chối/)
    const final = await getPrescriptionFromDb(data.pending._id)
    expect(final?.status).toBe('rejected')
    expect(final?.pharmacistNotes).toContain('Ảnh đơn thuốc bị mờ')

    await openReviewDialog(page, data.pending)
    await expect(page.getByTestId('rejection-reason')).toContainText('Ảnh đơn thuốc bị mờ')
    await expect(page.getByTestId('approve-btn')).toHaveCount(0)
    await expect(page.getByTestId('reject-btn')).toHaveCount(0)
    await expect(page.getByTestId('create-order-from-prescription-btn')).toHaveCount(0)
    await captureEvidence(page, '15-02-rejected-detail-no-actions')
  })
})
