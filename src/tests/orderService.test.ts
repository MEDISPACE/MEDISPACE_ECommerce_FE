import { beforeEach, describe, expect, it, vi } from 'vitest'

const post = vi.fn()
const put = vi.fn()

vi.mock('../services/apiClient', () => ({
  apiClient: { get: vi.fn(), post, put, patch: vi.fn() }
}))

vi.stubGlobal('crypto', { randomUUID: vi.fn(() => 'stable-idempotency-key') })

const { orderService } = await import('../services/orderService')

const backendOrder = {
  _id: 'order-1',
  userId: 'user-1',
  orderNumber: 'ORD-1',
  items: [],
  subtotal: 100_000,
  shippingFee: 30_000,
  discountAmount: 0,
  taxAmount: 0,
  totalAmount: 130_000,
  shippingAddress: {},
  paymentMethod: 'cod',
  paymentStatus: 'pending',
  orderStatus: 'pending',
  createdAt: '2026-06-13T00:00:00.000Z',
  updatedAt: '2026-06-13T00:00:00.000Z'
}

describe('orderService checkout contract', () => {
  beforeEach(() => vi.clearAllMocks())

  it('sends an idempotency key and preserves payment URL failure information', async () => {
    post.mockResolvedValue({
      data: {
        result: {
          order: backendOrder,
          paymentUrlError: true
        }
      }
    })

    const result = await orderService.createOrder({
      items: [],
      shippingAddress: {} as any,
      paymentMethod: 'vnpay'
    } as any)

    expect(post).toHaveBeenCalledWith(
      '/orders',
      expect.any(Object),
      { headers: { 'X-Idempotency-Key': 'stable-idempotency-key' } }
    )
    expect(result.paymentUrlError).toBe(true)
    expect(result.order.id).toBe('order-1')
  })

  it('uses the customer cancel endpoint instead of an admin status endpoint', async () => {
    put.mockResolvedValue({ data: { result: backendOrder } })

    await orderService.cancelOrder('order-1')

    expect(put).toHaveBeenCalledWith('/orders/order-1/cancel', { status: 'cancelled' })
  })
})
