import { test, expect } from '@playwright/test'
import { captureEvidence, cleanupPrescriptionData, getPrescriptionFromDb, newPharmacistPage, openPrescriptionPage, openReviewDialog, seedPrescriptionData } from './helpers'

test.describe('prescriptions/e2e/14.approve-flow', () => {
  test.afterEach(async () => cleanupPrescriptionData())

  test('approves a pending prescription with confirmation, loading guard, list refresh, and create-order action', async ({ browser }) => {
    const data = await seedPrescriptionData()
    const page = await newPharmacistPage(browser, data.pharmacist)
    await openPrescriptionPage(page)
    await openReviewDialog(page, data.pending)

    await page.getByTestId('approve-btn').click()
    await expect(page.getByTestId('confirmation-panel')).toContainText('Xác nhận phê duyệt')
    await captureEvidence(page, '14-01-approve-confirmation')
    await page.getByTestId('confirm-action-btn').dblclick()
    await expect(page.getByTestId('confirm-action-btn')).toBeDisabled()
    await expect(page.getByText(/Đơn thuốc đã được phê duyệt|thành công/i)).toBeVisible({ timeout: 15_000 })
    await expect(page.getByTestId(`prescription-card-${data.pending._id}`)).toContainText('Đã duyệt')
    const final = await getPrescriptionFromDb(data.pending._id)
    expect(final?.status).toBe('verified')

    await openReviewDialog(page, data.pending)
    await expect(page.getByTestId('create-order-from-prescription-btn')).toBeVisible()
    await expect(page.getByTestId('approve-btn')).toHaveCount(0)
    await captureEvidence(page, '14-02-approved-detail-create-order')
  })

  test('stale tab cannot approve an already processed prescription again', async ({ browser }) => {
    const data = await seedPrescriptionData()
    const pageA = await newPharmacistPage(browser, data.pharmacist)
    const pageB = await newPharmacistPage(browser, data.pharmacistB)
    await openPrescriptionPage(pageA)
    await openPrescriptionPage(pageB)
    await openReviewDialog(pageA, data.pending)
    await openReviewDialog(pageB, data.pending)

    await pageA.getByTestId('approve-btn').click()
    await pageA.getByTestId('confirm-action-btn').click()
    await expect.poll(async () => (await getPrescriptionFromDb(data.pending._id))?.status, { timeout: 15_000 }).toBe('verified')

    await pageB.getByTestId('approve-btn').click()
    await pageB.getByTestId('confirm-action-btn').click()
    await expect(pageB.getByText(/Không thể cập nhật|đã được xử lý|already/i).first()).toBeVisible({ timeout: 15_000 })
    await captureEvidence(pageB, '14-03-stale-tab-conflict')
    const final = await getPrescriptionFromDb(data.pending._id)
    expect(final?.status).toBe('verified')
  })

  test('pharmacist correction edits are saved atomically with approval', async ({ browser }) => {
    const data = await seedPrescriptionData()
    const page = await newPharmacistPage(browser, data.pharmacist)
    await openPrescriptionPage(page)
    await openReviewDialog(page, data.pending)

    await page.getByTestId('correction-patient-name').fill('Nguyen Van Corrected E2E')
    await page.getByTestId('correction-diagnosis').fill('Chẩn đoán đã hiệu chỉnh E2E')
    await page.getByTestId('correction-drug-name').first().fill('Amoxicillin 500mg corrected E2E')
    await page.getByTestId('correction-drug-instructions').first().fill('Uống sau ăn sáng và tối')
    await captureEvidence(page, '14-04-corrections-before-approve')

    await page.getByTestId('approve-btn').click()
    await page.getByTestId('confirm-action-btn').click()
    await expect.poll(async () => (await getPrescriptionFromDb(data.pending._id))?.status, { timeout: 15_000 }).toBe('verified')

    const final = await getPrescriptionFromDb(data.pending._id)
    expect(final).toEqual(expect.objectContaining({ patientName: 'Nguyen Van Corrected E2E', diagnosis: 'Chẩn đoán đã hiệu chỉnh E2E', status: 'verified' }))
    expect(final?.medications[0]).toEqual(expect.objectContaining({ productName: 'Amoxicillin 500mg corrected E2E', instructions: 'Uống sau ăn sáng và tối' }))
    expect(final?.correctedBy).toBeTruthy()
    expect(final?.correctedAt).toBeTruthy()
  })
})
