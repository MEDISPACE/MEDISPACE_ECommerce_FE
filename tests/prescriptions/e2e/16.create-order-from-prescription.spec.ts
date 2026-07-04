import { test, expect } from '@playwright/test'
import { API_URL, auth, captureEvidence, cleanupPrescriptionData, loginSession, newPharmacistPage, openPrescriptionPage, openReviewDialog, seedPrescriptionData } from './helpers'

function orderPayload(data: Awaited<ReturnType<typeof seedPrescriptionData>>, prescriptionId = data.verified._id.toString(), productId = data.product._id.toString(), quantity = 1) {
  return {
    prescriptionId,
    items: [{ productId, quantity, unit: 'Hộp' }],
    shippingAddress: { firstName: 'E2E', lastName: 'Customer', phone: '0900000999', email: 'e2e.rx.customer@medispace.local', address: '1 E2E Street', ward: 'Ben Thanh', district: '1', province: 'TP.HCM' },
    deliveryMethod: 'instore',
    paymentMethod: 'cash',
    safetyReviewConfirmed: true,
    pharmacistNotes: 'E2E order from prescription'
  }
}

test.describe('prescriptions/e2e/16.create-order-from-prescription', () => {
  test.afterEach(async () => cleanupPrescriptionData())

  test('opens create-order from verified prescription and shows source prescription context', async ({ browser }) => {
    const data = await seedPrescriptionData()
    const page = await newPharmacistPage(browser, data.pharmacist)
    await openPrescriptionPage(page)
    await openReviewDialog(page, data.verified)
    await page.getByTestId('create-order-from-prescription-btn').click()
    await expect(page).toHaveURL(/\/pharmacist\/create-order\?prescriptionId=/)
    await expect(page.getByTestId('create-order-page')).toBeVisible({ timeout: 30_000 })
    await expect(page.getByTestId('source-prescription-badge')).toContainText(data.verified.prescriptionNumber)
    await expect(page.getByTestId('customer-prescription-link')).toContainText(data.verified._id.toString())
    await captureEvidence(page, '16-01-create-order-prefilled')
  })

  test('server allows a verified prescription order to contain arbitrary products and no added VAT', async ({ request }) => {
    const data = await seedPrescriptionData()
    const session = await loginSession(data.pharmacist.email, data.pharmacist.password)
    const headers = auth(session.token)

    const arbitraryProduct = await request.post(`${API_URL}/pharmacist/orders`, {
      headers,
      data: orderPayload(data, data.verified._id.toString(), data.extraProduct._id.toString()),
    })
    expect([200, 201]).toContain(arbitraryProduct.status())
    const arbitraryOrder = (await arbitraryProduct.json()).result.order
    expect(arbitraryOrder.taxAmount).toBe(0)
    expect(arbitraryOrder.totalAmount).toBe(arbitraryOrder.subtotal + arbitraryOrder.shippingFee - arbitraryOrder.discountAmount)
  })

  test('server rejects pending prescription, excessive mapped quantity, and double fulfillment', async ({ request }) => {
    const data = await seedPrescriptionData()
    const session = await loginSession(data.pharmacist.email, data.pharmacist.password)
    const headers = auth(session.token)

    const pending = await request.post(`${API_URL}/pharmacist/orders`, { headers, data: orderPayload(data, data.pending._id.toString()) })
    expect(pending.status()).toBeGreaterThanOrEqual(400)

    const excessive = await request.post(`${API_URL}/pharmacist/orders`, { headers, data: orderPayload(data, data.verified._id.toString(), data.product._id.toString(), 99) })
    expect(excessive.status()).toBeGreaterThanOrEqual(400)

    const first = await request.post(`${API_URL}/pharmacist/orders`, { headers, data: orderPayload(data) })
    expect([200, 201]).toContain(first.status())
    const second = await request.post(`${API_URL}/pharmacist/orders`, { headers, data: orderPayload(data) })
    expect(second.status()).toBeGreaterThanOrEqual(400)
  })

  test('manual URL with pending prescription redirects away and cannot silently create an order', async ({ browser }) => {
    const data = await seedPrescriptionData()
    const page = await newPharmacistPage(browser, data.pharmacist)
    await page.goto(`/pharmacist/create-order?prescriptionId=${data.pending._id}`)
    await expect(page).toHaveURL(/\/pharmacist\/prescriptions/, { timeout: 30_000 })
    await expect(page.getByText(/Chỉ đơn thuốc đã được phê duyệt/i).first()).toBeVisible()
    await captureEvidence(page, '16-02-pending-prescription-blocked')
  })
})
