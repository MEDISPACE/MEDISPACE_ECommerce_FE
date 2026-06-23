import { describe, expect, test } from 'vitest'
import { calculateOrderTotal, canCancelOrder, canReorder, canReviewOrder, filterOrders, formatOrderStatus, mapApiOrderToUI, sortOrders } from '../helpers/account-unit'
import { orders } from '../fixtures/orders'

describe('account orders unit rules', () => {
  test('filterOrders by status returns correct subset', () => {
    expect(filterOrders(orders.withAllStatuses, 'processing')).toHaveLength(1)
  })

  test('filterOrders with all returns everything', () => {
    expect(filterOrders(orders.withAllStatuses, 'all')).toHaveLength(orders.withAllStatuses.length)
  })

  test('canCancelOrder returns true for pending status only in cancellable set', () => {
    expect(canCancelOrder({ status: 'pending' })).toBe(true)
  })

  test('canCancelOrder returns false for shipped/delivered/cancelled', () => {
    expect(['shipped', 'delivered', 'cancelled'].every((status) => !canCancelOrder({ status }))).toBe(true)
  })

  test('canReorder returns true only for completed orders', () => {
    expect(canReorder({ status: 'delivered' })).toBe(true)
    expect(canReorder({ status: 'processing' })).toBe(false)
  })

  test('canReviewOrder returns true only after delivery confirmed', () => {
    expect(canReviewOrder({ status: 'delivered', deliveredAt: '2026-06-20' })).toBe(true)
    expect(canReviewOrder({ status: 'delivered' })).toBe(false)
  })

  test('formatOrderStatus returns correct Vietnamese label per status', () => {
    expect(formatOrderStatus('processing')).toBe('Đang xử lý')
    expect(formatOrderStatus('shipping')).toBe('Đang giao')
  })

  test('calculateOrderTotal = items + shipping - discount', () => {
    expect(calculateOrderTotal({ items: [{ unitPrice: 100000, quantity: 2 }], shipping: 20000, discount: 50000 })).toBe(170000)
  })

  test('sortOrders by date descending works correctly', () => {
    expect(sortOrders(orders.withAllStatuses)[0].id).toBe('order-pending')
  })

  test('mapApiOrderToUI maps all fields without missing data', () => {
    expect(mapApiOrderToUI({ _id: 'o1', userId: 'u1', orderNumber: 'MS1', orderStatus: 'pending', items: [], shippingFee: 1, discountAmount: 2, totalAmount: 3 })).toEqual({ id: 'o1', userId: 'u1', orderNumber: 'MS1', status: 'pending', items: [], shipping: 1, discount: 2, total: 3 })
  })
})
