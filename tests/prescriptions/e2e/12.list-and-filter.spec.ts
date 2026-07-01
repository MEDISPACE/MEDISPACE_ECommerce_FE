import { test, expect } from '@playwright/test'
import { captureEvidence, cleanupPrescriptionData, newPharmacistPage, openPrescriptionPage, seedPrescriptionData, selectRadixOption } from './helpers'

test.describe('prescriptions/e2e/12.list-and-filter', () => {
  test.afterEach(async () => cleanupPrescriptionData())

  test('lists real prescriptions, filters, searches, paginates, and shows empty states', async ({ browser }) => {
    const data = await seedPrescriptionData({ longPending: true })
    const page = await newPharmacistPage(browser, data.pharmacist)
    await openPrescriptionPage(page)
    await captureEvidence(page, '12-01-list-loaded')

    await page.getByTestId('prescription-search-input').fill(data.pending.prescriptionNumber)
    await expect(page.getByTestId(`prescription-card-${data.pending._id}`)).toBeVisible()
    await page.getByTestId('prescription-search-input').fill('')
    await expect(page.getByTestId('prescription-stat-chờ-xử-lý')).toContainText(/\d+/)
    await expect(page.getByTestId('prescription-stat-hết-hạn')).toContainText(/\d+/)

    await selectRadixOption(page, 'prescription-status-filter', 'Chờ xử lý')
    await expect(page.locator('[data-testid^="prescription-card-"]')).toHaveCount(5)
    await expect(page.getByTestId(`prescription-card-${data.verified._id}`)).toHaveCount(0)

    await selectRadixOption(page, 'prescription-status-filter', 'Hết hạn')
    await expect(page.getByTestId(`prescription-card-${data.expired._id}`)).toBeVisible()
    expect(await page.locator('[data-testid^="prescription-card-"][data-status="expired"]').count()).toBeGreaterThanOrEqual(1)
    await captureEvidence(page, '12-02-expired-filter')

    await selectRadixOption(page, 'prescription-status-filter', 'Tất cả trạng thái')
    await selectRadixOption(page, 'prescription-date-filter', 'Hôm nay')
    await expect(page.getByTestId(`prescription-card-${data.today._id}`)).toBeVisible()

    await selectRadixOption(page, 'prescription-date-filter', 'Tất cả thời gian')
    await page.getByTestId('prescription-search-input').fill(data.pending.prescriptionNumber)
    await expect(page.getByTestId(`prescription-card-${data.pending._id}`)).toBeVisible()

    await page.getByTestId('prescription-search-input').fill('[E2E-RX] Dr. QA')
    await expect(page.locator('[data-testid^="prescription-card-"]')).not.toHaveCount(0)

    await page.getByTestId('prescription-search-input').fill('0900000999')
    await expect(page.getByTestId('prescription-empty-state')).toBeVisible()

    await page.getByTestId('prescription-search-input').fill('E2E-RX-PAGE')
    await selectRadixOption(page, 'prescription-date-filter', 'Tất cả thời gian')
    await expect(page.getByTestId('pagination-page-btn').filter({ hasText: '2' })).toBeVisible()
    await page.getByTestId('pagination-page-btn').filter({ hasText: '2' }).click()
    await expect(page.locator('[data-testid^="prescription-card-"]')).not.toHaveCount(0)

    await page.getByTestId('prescription-search-input').fill('NO-SUCH-RX')
    await expect(page.getByTestId('prescription-empty-state')).toBeVisible()
    await captureEvidence(page, '12-03-empty-state')
  })
})
