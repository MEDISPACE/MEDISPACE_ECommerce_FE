import { expect, test } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { cleanupPrescriptionData, newPharmacistPage, seedPrescriptionData } from '../../prescriptions/e2e/helpers'

async function captureViewport(page: import('@playwright/test').Page, name: string) {
  await mkdir('tests/prescriptions/evidence', { recursive: true })
  await page.screenshot({ path: `tests/prescriptions/evidence/${name}.png`, fullPage: false })
}

test.describe('pharmacist patient prescription archive', () => {
  test.afterEach(async () => cleanupPrescriptionData())

  test('pharmacist can find a patient, review verified prescriptions, and start a repeat order', async ({ browser }) => {
    const data = await seedPrescriptionData()
    const page = await newPharmacistPage(browser, data.pharmacist)

    await page.goto('/pharmacist/patient-history')
    await expect(page.getByRole('heading', { name: 'Lịch sử bệnh nhân' })).toBeVisible({ timeout: 30_000 })
    const searchInput = page.getByRole('textbox', { name: /Nhập số điện thoại bệnh nhân/ })
    await searchInput.fill('0900000999')
    const searchResponsePromise = page.waitForResponse((res) => res.url().includes('/pharmacist/patients/search') && res.status() === 200)
    await searchInput.press('Enter')
    const searchResponse = await searchResponsePromise
    expect((await searchResponse.json()).result.length).toBeGreaterThan(0)
    await expect(page.getByText('E2E Customer')).toBeVisible({ timeout: 30_000 })

    await page.getByText('E2E Customer').click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('tab', { name: 'Đơn xác minh' }).click()
    await expect(page.getByText(data.verified.prescriptionNumber)).toBeVisible()
    await expect(page.getByText(data.product.name)).toBeVisible()
    await captureViewport(page, 'pharmacist-patient-archive-01-verified-prescriptions')

    await page.getByRole('button', { name: /Tạo đơn lại/ }).click()
    await expect(page).toHaveURL(new RegExp(`/pharmacist/create-order\\?prescriptionId=${data.verified._id.toString()}`))
    await expect(page.getByTestId('create-order-page')).toBeVisible({ timeout: 30_000 })
    await expect(page.getByTestId('source-prescription-badge')).toContainText(data.verified.prescriptionNumber)
    await captureViewport(page, 'pharmacist-patient-archive-02-repeat-order')
  })
})
