import { expect, test, type Browser } from '@playwright/test'
import {
  API_URL,
  auth,
  captureEvidence,
  cleanupPrescriptionData,
  loginSession,
  mockImageStorage,
  seedPrescriptionData,
} from '../../prescriptions/e2e/helpers'

async function newCustomerPage(browser: Browser, account: { email: string; password: string }) {
  const session = await loginSession(account.email, account.password)
  const context = await browser.newContext()
  const page = await context.newPage()
  await mockImageStorage(page)
  await page.goto('/')
  await page.evaluate(({ token, user }) => {
    localStorage.setItem('medispace_access_token', token)
    localStorage.setItem('medispace_user_data', JSON.stringify(user))
    localStorage.setItem('medispace_session_hint', '1')
  }, session)
  return page
}

function pharmacistOrderPayload(data: Awaited<ReturnType<typeof seedPrescriptionData>>) {
  return {
    prescriptionId: data.verified._id.toString(),
    items: [{ productId: data.extraProduct._id.toString(), quantity: 1, unit: 'Hộp' }],
    shippingAddress: {
      firstName: 'E2E',
      lastName: 'Customer',
      phone: '0900000999',
      email: data.customer.email,
      address: 'Tại quầy',
      ward: '',
      district: '',
      province: '',
    },
    deliveryMethod: 'instore',
    paymentMethod: 'cash',
    safetyReviewConfirmed: true,
    pharmacistNotes: 'E2E customer prescription archive linked order',
  }
}

test.describe.serial('customer prescription archive', () => {
  test.afterEach(async () => cleanupPrescriptionData())

  test('customer can buy from a verified prescription, then see linked order in list and detail', async ({ browser, request }) => {
    const data = await seedPrescriptionData()
    const page = await newCustomerPage(browser, data.customer)

    await page.goto('/account/prescriptions')
    await expect(page.getByTestId('prescriptions-page')).toBeVisible({ timeout: 30_000 })
    await page.getByRole('tab', { name: /Đã xác nhận/ }).click()
    await expect(page.getByRole('heading', { name: new RegExp(data.verified.prescriptionNumber) })).toBeVisible()
    await expect(page.getByRole('link', { name: /Mua \/ nạp lại thuốc/ }).first()).toHaveAttribute(
      'href',
      new RegExp(`/products\\?prescriptionId=${data.verified._id.toString()}&rx=verified`)
    )
    await captureEvidence(page, 'customer-archive-01-verified-prescription-buy-again')

    const pharmacist = await loginSession(data.pharmacist.email, data.pharmacist.password)
    const createOrder = await request.post(`${API_URL}/pharmacist/orders`, {
      headers: { ...auth(pharmacist.token), 'x-idempotency-key': `customer-archive-${Date.now()}` },
      data: pharmacistOrderPayload(data),
    })
    expect(createOrder.ok(), await createOrder.text()).toBeTruthy()
    const order = (await createOrder.json()).result.order
    expect(order.prescriptionId).toBe(data.verified._id.toString())
    expect(order.taxAmount).toBe(0)

    const customer = await loginSession(data.customer.email, data.customer.password)
    const prescriptions = await request.get(`${API_URL}/prescriptions`, { headers: auth(customer.token) })
    expect(prescriptions.ok(), await prescriptions.text()).toBeTruthy()
    const rows = (await prescriptions.json()).result.prescriptions
    const linked = rows.find((row: { _id: string }) => row._id === data.verified._id.toString())
    expect(linked).toEqual(expect.objectContaining({ orderId: order._id, orderNumber: order.orderNumber }))

    await page.reload()
    await page.getByRole('tab', { name: /Hoàn thành/ }).click()
    await expect(page.getByRole('heading', { name: new RegExp(data.verified.prescriptionNumber) })).toBeVisible()
    await expect(page.getByRole('link', { name: /Xem đơn hàng/ }).first()).toHaveAttribute(
      'href',
      new RegExp(`/account/orders/${order._id}`)
    )
    await captureEvidence(page, 'customer-archive-02-linked-order-in-list')

    await page.goto(`/account/prescriptions/${data.verified._id.toString()}`)
    await expect(page.getByRole('heading', { name: new RegExp(data.verified.prescriptionNumber) })).toBeVisible()
    await expect(page.getByText(order.orderNumber)).toBeVisible()
    await expect(page.getByRole('link', { name: /Xem đơn hàng/ }).first()).toHaveAttribute(
      'href',
      new RegExp(`/account/orders/${order._id}`)
    )
    await captureEvidence(page, 'customer-archive-03-linked-order-in-detail')
  })
})
