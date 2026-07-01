import { test, expect } from '@playwright/test'
import { captureEvidence, cleanupPrescriptionData, newPharmacistPage, openPrescriptionPage, openReviewDialog, seedPrescriptionData } from './helpers'

test.describe('prescriptions/e2e/13.review-detail', () => {
  test.afterEach(async () => cleanupPrescriptionData())

  test('opens review dialog with image, patient, doctor, customer, drugs, mapping, and stock indicators', async ({ browser }) => {
    const data = await seedPrescriptionData()
    const page = await newPharmacistPage(browser, data.pharmacist)
    await openPrescriptionPage(page)
    await openReviewDialog(page, data.pending)

    await expect(page.getByTestId('prescription-image-viewer')).toBeVisible()
    await expect(page.getByTestId('patient-info-section')).toContainText('Nguyen Van E2E')
    await expect(page.getByTestId('patient-info-section')).toContainText('Viêm họng cấp')
    await expect(page.getByTestId('doctor-info-section')).toContainText('[E2E-RX] Dr. QA')
    await expect(page.getByTestId('customer-account-section')).toContainText('0900000999')
    await expect(page.getByTestId('drug-list')).toContainText('Amoxicillin 500mg')
    await expect(page.getByTestId('matched-product-confidence')).toBeVisible()
    await expect(page.getByTestId('unmatched-drug-warning')).toBeVisible()
    await page.getByTestId('prescription-image-viewer').locator('img').first().evaluate((img: HTMLImageElement) => {
      if (img.complete && img.naturalWidth > 0) return
      return new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('Prescription image failed to load'))
      })
    })
    await captureEvidence(page, '13-01-review-detail-modal')
  })

  test('missing customer reference is handled without crashing', async ({ browser }) => {
    const data = await seedPrescriptionData({ missingCustomer: true })
    const page = await newPharmacistPage(browser, data.pharmacist)
    await openPrescriptionPage(page)
    await openReviewDialog(page, data.pending)
    await expect(page.getByTestId('customer-account-missing')).toBeVisible()
    await expect(page.getByTestId('drug-list')).toBeVisible()
    await captureEvidence(page, '13-02-missing-customer-fallback')
  })
})
