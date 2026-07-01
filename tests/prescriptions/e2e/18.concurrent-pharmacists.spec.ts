import { test, expect } from '@playwright/test'
import { captureEvidence, cleanupPrescriptionData, getPrescriptionFromDb, newPharmacistPage, openPrescriptionPage, openReviewDialog, seedPrescriptionData } from './helpers'

test.describe('prescriptions/e2e/18.concurrent-pharmacists', () => {
  test.afterEach(async () => cleanupPrescriptionData())

  test('two pharmacists approve the same prescription: exactly one succeeds and loser sees processed state', async ({ browser }) => {
    const data = await seedPrescriptionData()
    const pageA = await newPharmacistPage(browser, data.pharmacist)
    const pageB = await newPharmacistPage(browser, data.pharmacistB)
    await Promise.all([openPrescriptionPage(pageA), openPrescriptionPage(pageB)])
    await Promise.all([openReviewDialog(pageA, data.pending), openReviewDialog(pageB, data.pending)])
    await Promise.all([pageA.getByTestId('approve-btn').click(), pageB.getByTestId('approve-btn').click()])

    await Promise.allSettled([pageA.getByTestId('confirm-action-btn').click(), pageB.getByTestId('confirm-action-btn').click()])
    await expect.poll(async () => (await getPrescriptionFromDb(data.pending._id))?.status, { timeout: 15_000 }).toBe('verified')
    const final = await getPrescriptionFromDb(data.pending._id)
    expect(final?.status).toBe('verified')
    await Promise.all([pageA.reload(), pageB.reload()])
    await Promise.all([openPrescriptionPage(pageA), openPrescriptionPage(pageB)])
    await Promise.all([pageA.getByTestId('prescription-search-input').fill(data.pending.prescriptionNumber), pageB.getByTestId('prescription-search-input').fill(data.pending.prescriptionNumber)])
    await expect(pageA.getByTestId(`prescription-card-${data.pending._id}`)).toContainText('Đã duyệt')
    await expect(pageB.getByTestId(`prescription-card-${data.pending._id}`)).toContainText('Đã duyệt')
    await captureEvidence(pageA, '18-01-concurrent-approve-winner-final')
    await captureEvidence(pageB, '18-02-concurrent-approve-loser-final')
  })

  test('approve-vs-reject race leaves one consistent final state and loser cannot blindly retry', async ({ browser }) => {
    const data = await seedPrescriptionData()
    const pageA = await newPharmacistPage(browser, data.pharmacist)
    const pageB = await newPharmacistPage(browser, data.pharmacistB)
    await Promise.all([openPrescriptionPage(pageA), openPrescriptionPage(pageB)])
    await Promise.all([openReviewDialog(pageA, data.pending), openReviewDialog(pageB, data.pending)])
    await pageA.getByTestId('approve-btn').click()
    await pageB.getByTestId('reject-btn').click()
    await pageB.getByTestId('pharmacist-notes-input').fill('Dược sĩ B từ chối cùng thời điểm')

    await Promise.allSettled([pageA.getByTestId('confirm-action-btn').click(), pageB.getByTestId('confirm-action-btn').click()])
    const final = await getPrescriptionFromDb(data.pending._id)
    expect(['verified', 'rejected']).toContain(final?.status)
    if (final?.status === 'verified') expect(final.pharmacistNotes).toBeFalsy()
    if (final?.status === 'rejected') expect(final.pharmacistNotes).toContain('Dược sĩ B')
    await Promise.all([pageA.reload(), pageB.reload()])
    await Promise.all([openPrescriptionPage(pageA), openPrescriptionPage(pageB)])
    await Promise.all([pageA.getByTestId('prescription-search-input').fill(data.pending.prescriptionNumber), pageB.getByTestId('prescription-search-input').fill(data.pending.prescriptionNumber)])
    const finalLabel = final?.status === 'verified' ? 'Đã duyệt' : 'Từ chối'
    await expect(pageA.getByTestId(`prescription-card-${data.pending._id}`)).toContainText(finalLabel)
    await expect(pageB.getByTestId(`prescription-card-${data.pending._id}`)).toContainText(finalLabel)
    await captureEvidence(pageA, '18-03-approve-vs-reject-final-a')
    await captureEvidence(pageB, '18-04-approve-vs-reject-final-b')
  })
})
