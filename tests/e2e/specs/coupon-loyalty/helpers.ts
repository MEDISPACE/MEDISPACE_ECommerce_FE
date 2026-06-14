/**
 * helpers.ts – Shared utilities for Coupon & Loyalty E2E tests
 *
 * Covers: coupon CRUD, cart apply/remove, loyalty account,
 * order create, order status update, return request flow.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { type APIRequestContext, expect } from '@playwright/test'

export const APP_URL = process.env.E2E_BASE_URL || 'http://localhost:3000'
export const API_URL = process.env.E2E_API_URL || 'http://localhost:8000'
export const AUTH_DIR = path.resolve('tests/e2e/.auth')

// ── Types ─────────────────────────────────────────────────────────────────────

export type Session = {
  token: string
  user: { _id: string; email: string }
}

export type Sessions = {
  admin: Session
  customer: Session
  customer2: Session
}

export type CouponPayload = {
  code: string
  name: string
  type: 'percentage' | 'fixed_amount' | 'fixed' | 'free_shipping'
  value: number
  minOrderAmount?: number
  maxDiscountAmount?: number
  totalUsageLimit?: number
  perUserLimit?: number
  isPublic?: boolean
  startDate?: string
  endDate?: string
  excludePrescriptionItems?: boolean
}

// ── Session helpers ────────────────────────────────────────────────────────────

export function sessions(): Sessions {
  return JSON.parse(readFileSync(path.join(AUTH_DIR, 'sessions.json'), 'utf8')) as Sessions
}

export function auth(token: string) {
  return { Authorization: `Bearer ${token}` }
}

export function pickData(payload: any): any {
  if (payload?.data !== undefined) return payload.data
  if (payload?.result !== undefined) return payload.result
  return payload
}

/** Generates a unique coupon code for each test run to avoid conflicts */
export function uniqueCode(prefix: string) {
  return `${prefix.toUpperCase()}${Date.now().toString().slice(-7)}`
}

/** Returns valid date window: start = yesterday, end = 30 days from now */
export function validDateWindow() {
  const start = new Date(Date.now() - 86_400_000).toISOString()
  const end = new Date(Date.now() + 30 * 86_400_000).toISOString()
  return { startDate: start, endDate: end }
}

/** Returns expired date window */
export function expiredDateWindow() {
  const start = new Date(Date.now() - 10 * 86_400_000).toISOString()
  const end = new Date(Date.now() - 86_400_000).toISOString()
  return { startDate: start, endDate: end }
}

/** Returns future date window */
export function futureDateWindow() {
  const start = new Date(Date.now() + 5 * 86_400_000).toISOString()
  const end = new Date(Date.now() + 30 * 86_400_000).toISOString()
  return { startDate: start, endDate: end }
}

// ── Coupon API helpers ────────────────────────────────────────────────────────

export async function createCoupon(api: APIRequestContext, admin: Session, data: CouponPayload) {
  const payload = {
    minOrderAmount: 0,
    perUserLimit: 1,
    isPublic: true,
    ...validDateWindow(),
    ...data,
  }
  const res = await api.post(`${API_URL}/coupons`, {
    headers: auth(admin.token),
    data: payload,
  })
  expect(res.ok(), `createCoupon failed: ${res.status()} ${await res.text()}`).toBeTruthy()
  return pickData(await res.json())
}

export async function updateCoupon(
  api: APIRequestContext,
  admin: Session,
  couponId: string,
  data: Partial<CouponPayload>,
) {
  const res = await api.put(`${API_URL}/coupons/${couponId}`, {
    headers: auth(admin.token),
    data,
  })
  expect(res.ok(), `updateCoupon failed: ${res.status()}`).toBeTruthy()
  return pickData(await res.json())
}

export async function deleteCoupon(api: APIRequestContext, admin: Session, couponId: string) {
  const res = await api.delete(`${API_URL}/coupons/${couponId}`, {
    headers: auth(admin.token),
  })
  expect(res.ok(), `deleteCoupon failed: ${res.status()}`).toBeTruthy()
  return pickData(await res.json())
}

export async function toggleCoupon(api: APIRequestContext, admin: Session, couponId: string) {
  const res = await api.patch(`${API_URL}/coupons/${couponId}/toggle`, {
    headers: auth(admin.token),
    data: {},
  })
  expect(res.ok(), `toggleCoupon failed: ${res.status()}`).toBeTruthy()
  return pickData(await res.json())
}

export async function getPublicCoupons(api: APIRequestContext) {
  const res = await api.get(`${API_URL}/coupons/public`)
  expect(res.ok()).toBeTruthy()
  return pickData(await res.json()) as any[]
}

export async function validateCoupon(
  api: APIRequestContext,
  session: Session,
  code: string,
  cartSubtotal: number,
  hasPrescriptionItems = false,
) {
  const res = await api.post(`${API_URL}/coupons/validate`, {
    headers: auth(session.token),
    data: { code, cartSubtotal, hasPrescriptionItems },
  })
  return res
}

export async function applyCoupon(
  api: APIRequestContext,
  session: Session,
  code: string,
  selectedSubtotal?: number,
) {
  const body: any = { code }
  if (selectedSubtotal !== undefined) body.selectedSubtotal = selectedSubtotal
  const res = await api.post(`${API_URL}/coupons/apply`, {
    headers: auth(session.token),
    data: body,
  })
  return res
}

export async function removeCoupon(api: APIRequestContext, session: Session, code: string) {
  const res = await api.delete(`${API_URL}/coupons/remove`, {
    headers: auth(session.token),
    data: { code },
  })
  return res
}

// ── Cart helpers ──────────────────────────────────────────────────────────────

export async function getCart(api: APIRequestContext, session: Session) {
  const res = await api.get(`${API_URL}/cart`, { headers: auth(session.token) })
  expect(res.ok(), `getCart failed: ${res.status()}`).toBeTruthy()
  return pickData(await res.json())
}

export async function clearCart(api: APIRequestContext, session: Session) {
  const res = await api.delete(`${API_URL}/cart/clear`, { headers: auth(session.token) })
  // OK or not-found are both fine
  return res
}

/**
 * Fetches the first in-stock, non-prescription product from the catalog.
 * Used to add items to cart without needing a fixed seed product ID.
 */
export async function getFirstAvailableProduct(api: APIRequestContext) {
  const res = await api.get(`${API_URL}/products`, {
    params: { limit: 10, page: 1 },
  })
  expect(res.ok()).toBeTruthy()
  const data = pickData(await res.json())
  const products = data.products || data
  const product = products.find((p: any) => !p.requiresPrescription && p.stockQuantity > 0 && p.isActive !== false)
  expect(product, 'No available non-prescription product found').toBeTruthy()
  return product
}

export async function addToCart(
  api: APIRequestContext,
  session: Session,
  productId: string,
  quantity = 1,
  unit?: string,
) {
  const body: any = { productId, quantity }
  if (unit) body.unit = unit
  const res = await api.post(`${API_URL}/cart/add`, {
    headers: auth(session.token),
    data: body,
  })
  expect(res.ok(), `addToCart failed: ${res.status()} ${await res.text()}`).toBeTruthy()
  return pickData(await res.json())
}

// ── Loyalty helpers ───────────────────────────────────────────────────────────

export async function getLoyaltyAccount(api: APIRequestContext, session: Session) {
  const res = await api.get(`${API_URL}/loyalty/account`, { headers: auth(session.token) })
  expect(res.ok(), `getLoyaltyAccount failed: ${res.status()}`).toBeTruthy()
  return pickData(await res.json())
}

export async function getLoyaltyTransactions(
  api: APIRequestContext,
  session: Session,
  params: Record<string, string | number> = {},
) {
  const res = await api.get(`${API_URL}/loyalty/transactions`, {
    headers: auth(session.token),
    params: { page: 1, limit: 20, ...params },
  })
  expect(res.ok(), `getLoyaltyTransactions failed: ${res.status()}`).toBeTruthy()
  return pickData(await res.json())
}

export async function previewRedeem(
  api: APIRequestContext,
  session: Session,
  orderSubtotal: number,
) {
  const res = await api.post(`${API_URL}/loyalty/preview-redeem`, {
    headers: auth(session.token),
    data: { orderSubtotal },
  })
  return res
}

export async function getAdminLoyaltyStats(api: APIRequestContext, admin: Session) {
  const res = await api.get(`${API_URL}/loyalty/admin/stats`, {
    headers: auth(admin.token),
  })
  expect(res.ok(), `getAdminLoyaltyStats failed: ${res.status()}`).toBeTruthy()
  return pickData(await res.json())
}

// ── Order helpers ─────────────────────────────────────────────────────────────

export async function getFirstAddress(api: APIRequestContext, session: Session) {
  const res = await api.get(`${API_URL}/users/addresses`, { headers: auth(session.token) })
  expect(res.ok()).toBeTruthy()
  const data = pickData(await res.json())
  const addresses = data.addresses || data
  if (!addresses || addresses.length === 0) return null
  return addresses[0]
}

export async function createTestAddress(api: APIRequestContext, session: Session) {
  const res = await api.post(`${API_URL}/users/addresses`, {
    headers: auth(session.token),
    data: {
      recipientName: 'E2E Tester',
      phone: '0901234567',
      address: '123 Đường Test',
      ward: 'Phường 1',
      district: 'Quận 1',
      province: 'TP. Hồ Chí Minh',
      isDefault: true,
    },
  })
  if (!res.ok()) return null
  return pickData(await res.json())
}

/**
 * Creates a COD order. cartItems must already be in cart.
 * Optionally pass couponCodes and pointsToRedeem.
 */
export async function createCODOrder(
  api: APIRequestContext,
  session: Session,
  options: {
    couponCodes?: string[]
    pointsToRedeem?: number
    selectedItems?: { productId: string; quantity: number; unit?: string }[]
    shippingFee?: number
  } = {},
) {
  // Get shipping address
  let addr = await getFirstAddress(api, session)
  if (!addr) addr = await createTestAddress(api, session)
  expect(addr, 'No shipping address available').toBeTruthy()

  const shippingAddress = {
    firstName: 'E2E',
    lastName: 'Tester',
    phone: addr.phone || '0901234567',
    email: session.user.email,
    address: addr.address || '123 Test St',
    ward: addr.ward || 'Ward 1',
    district: addr.district || 'District 1',
    province: addr.province || 'HCM',
  }

  const body: any = {
    shippingAddress,
    paymentMethod: 'cod',
    shippingMethod: 'standard',
    shippingFee: options.shippingFee ?? 30000,
    estimatedDeliveryDate: '2-4 ngày',
  }

  if (options.couponCodes && options.couponCodes.length > 0) {
    body.couponCodes = options.couponCodes
    body.isDirectBuy = true // direct buy path for simplicity in tests
    // add selectedItems for direct buy
    body.selectedItems = options.selectedItems || []
  } else if (options.selectedItems && options.selectedItems.length > 0) {
    body.isDirectBuy = false
    body.selectedItems = options.selectedItems
  }

  if (options.pointsToRedeem && options.pointsToRedeem > 0) {
    body.pointsToRedeem = options.pointsToRedeem
  }

  const res = await api.post(`${API_URL}/orders`, {
    headers: auth(session.token),
    data: body,
  })
  return res
}

export async function updateOrderStatus(
  api: APIRequestContext,
  admin: Session,
  orderId: string,
  status: string,
  extras: Record<string, unknown> = {},
) {
  const res = await api.put(`${API_URL}/orders/${orderId}/status`, {
    headers: auth(admin.token),
    data: { status, ...extras },
  })
  return res
}

export async function getOrderById(api: APIRequestContext, session: Session, orderId: string) {
  const res = await api.get(`${API_URL}/orders/${orderId}`, { headers: auth(session.token) })
  expect(res.ok(), `getOrderById failed: ${res.status()}`).toBeTruthy()
  return pickData(await res.json())
}

export async function createReturnRequest(
  api: APIRequestContext,
  session: Session,
  orderId: string,
  items: { productId: string; quantity: number; unit: string; returnReason: string }[],
) {
  // POST /returns — returnRequestsRouter
  const res = await api.post(`${API_URL}/returns`, {
    headers: auth(session.token),
    data: { orderId, items },
  })
  return res
}

export async function approveReturnRequest(
  api: APIRequestContext,
  admin: Session,
  requestId: string,
  notes = 'E2E test approval',
) {
  // PATCH /returns/admin/:requestId/review
  const res = await api.patch(`${API_URL}/returns/admin/${requestId}/review`, {
    headers: auth(admin.token),
    data: { status: 'approved', notes },
  })
  return res
}

export async function processRefund(
  api: APIRequestContext,
  admin: Session,
  requestId: string,
  refundAmount: number,
  refundMethod: string,
) {
  // PATCH /returns/admin/:requestId/refund
  const res = await api.patch(`${API_URL}/returns/admin/${requestId}/refund`, {
    headers: auth(admin.token),
    data: { refundAmount, refundMethod, notes: 'E2E refund' },
  })
  return res
}
