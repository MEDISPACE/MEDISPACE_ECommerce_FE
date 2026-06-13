import { expect, test, type APIRequestContext } from '@playwright/test'
import {
  API_URL,
  auth,
  addToCart,
  clearCart,
  pickData,
  sessions,
  type Session
} from './coupon-loyalty/helpers'
import { getSeedManifest } from './coupon-loyalty/db'

let admin: Session
let customer: Session
let customer2: Session
let productId: string

const shippingAddress = {
  firstName: 'E2E',
  lastName: 'Checkout',
  phone: '0901234567',
  email: 'e2e.customer@medispace.local',
  address: '123 Test Street',
  ward: 'Phường 1',
  district: 'Quận 1',
  province: 'TP. Hồ Chí Minh'
}

function checkoutBody(overrides: Record<string, unknown> = {}) {
  return {
    selectedItems: [{ productId, quantity: 1, unit: 'Viên' }],
    isDirectBuy: true,
    shippingAddress,
    paymentMethod: 'cod',
    shippingMethod: 'standard',
    shippingFee: 0,
    estimatedDeliveryDate: '2-4 ngày',
    ...overrides
  }
}

async function cancel(api: APIRequestContext, session: Session, orderId?: string) {
  if (!orderId) return
  await api.put(`${API_URL}/orders/${orderId}/cancel`, {
    headers: auth(session.token),
    data: {}
  })
}

test.beforeAll(() => {
  const loaded = sessions()
  admin = loaded.admin
  customer = loaded.customer
  customer2 = loaded.customer2
  productId = getSeedManifest().products['E2E-PROD-001']
})

test.describe.serial('Cart, checkout and payment hardening', () => {
  test.beforeEach(async ({ request }) => {
    await clearCart(request, customer)
    await clearCart(request, customer2)
  })

  test('server ignores a forged zero shipping fee below the free-shipping threshold', async ({ request }) => {
    const res = await request.post(`${API_URL}/orders`, {
      headers: { ...auth(customer.token), 'X-Idempotency-Key': `shipping-${Date.now()}` },
      data: checkoutBody({ shippingFee: 0 })
    })
    expect(res.ok(), await res.text()).toBeTruthy()
    const result = pickData(await res.json())

    expect(result.order.subtotal).toBe(100_000)
    expect(result.order.shippingFee).toBe(30_000)
    expect(result.order.totalAmount).toBe(130_000)
    await cancel(request, customer, result.order._id)
  })

  test('the same idempotency key returns the same order and creates no duplicate', async ({ request }) => {
    const key = `idempotency-${Date.now()}`
    const headers = { ...auth(customer.token), 'X-Idempotency-Key': key }

    const first = await request.post(`${API_URL}/orders`, { headers, data: checkoutBody() })
    expect(first.ok(), await first.text()).toBeTruthy()
    const firstResult = pickData(await first.json())

    const second = await request.post(`${API_URL}/orders`, { headers, data: checkoutBody() })
    expect(second.ok(), await second.text()).toBeTruthy()
    const secondResult = pickData(await second.json())

    expect(secondResult.order._id).toBe(firstResult.order._id)
    await cancel(request, customer, firstResult.order._id)
  })

  test('customer cannot read another customer order or admin order list', async ({ request }) => {
    const created = await request.post(`${API_URL}/orders`, {
      headers: { ...auth(customer.token), 'X-Idempotency-Key': `idor-${Date.now()}` },
      data: checkoutBody()
    })
    expect(created.ok(), await created.text()).toBeTruthy()
    const order = pickData(await created.json()).order

    const otherUserRead = await request.get(`${API_URL}/orders/${order._id}`, {
      headers: auth(customer2.token)
    })
    expect([403, 404]).toContain(otherUserRead.status())

    const adminList = await request.get(`${API_URL}/orders/admin/all`, {
      headers: auth(customer.token)
    })
    expect(adminList.status()).toBe(403)
    await cancel(request, customer, order._id)
  })

  test('customer cannot update order or payment status, but admin can', async ({ request }) => {
    const created = await request.post(`${API_URL}/orders`, {
      headers: { ...auth(customer.token), 'X-Idempotency-Key': `roles-${Date.now()}` },
      data: checkoutBody()
    })
    expect(created.ok(), await created.text()).toBeTruthy()
    const order = pickData(await created.json()).order

    const statusAttack = await request.put(`${API_URL}/orders/${order._id}/status`, {
      headers: auth(customer.token),
      data: { status: 'delivered' }
    })
    const paymentAttack = await request.put(`${API_URL}/orders/${order._id}/payment`, {
      headers: auth(customer.token),
      data: { paymentStatus: 'paid' }
    })
    expect(statusAttack.status()).toBe(403)
    expect(paymentAttack.status()).toBe(403)

    const adminUpdate = await request.put(`${API_URL}/orders/${order._id}/status`, {
      headers: auth(admin.token),
      data: { status: 'confirmed' }
    })
    expect(adminUpdate.ok(), await adminUpdate.text()).toBeTruthy()
    await cancel(request, customer, order._id)
  })

  test('forged PayOS return parameters never confirm payment', async ({ request }) => {
    const created = await request.post(`${API_URL}/orders`, {
      headers: { ...auth(customer.token), 'X-Idempotency-Key': `payos-${Date.now()}` },
      data: checkoutBody({ paymentMethod: 'payos' })
    })
    expect(created.ok(), await created.text()).toBeTruthy()
    const order = pickData(await created.json()).order

    const forgedReturn = await request.get(`${API_URL}/payment/payos/return`, {
      params: { orderId: order._id, status: 'PAID', code: '00' },
      maxRedirects: 0
    })
    expect(forgedReturn.status()).toBe(302)
    expect(forgedReturn.headers().location).toContain('paymentStatus=pending')

    const read = await request.get(`${API_URL}/orders/${order._id}`, {
      headers: auth(customer.token)
    })
    expect(pickData(await read.json()).paymentStatus).toBe('pending')
    await cancel(request, customer, order._id)
  })

  test('empty cart page prevents checkout', async ({ page }) => {
    await page.goto('/cart')
    await expect(page.getByText(/giỏ hàng.*trống|chưa có sản phẩm/i).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /thanh toán/i })).toHaveCount(0)
  })
})
