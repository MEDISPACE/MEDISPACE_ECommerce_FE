import { describe, expect, test } from 'vitest'
import { calculateRefundAmount, isReturnEligible, validateReturnForm, validateReturnPhoto } from '../helpers/account-unit'

describe('account returns unit rules', () => {
  test('isReturnEligible true if within return window', () => {
    expect(isReturnEligible({ status: 'delivered', deliveredAt: '2026-06-20' })).toBe(true)
  })

  test('isReturnEligible false if outside return window', () => {
    expect(isReturnEligible({ status: 'delivered', deliveredAt: '2026-06-01' })).toBe(false)
  })

  test('isReturnEligible false if already returned', () => {
    expect(isReturnEligible({ status: 'delivered', deliveredAt: '2026-06-20', returned: true })).toBe(false)
  })

  test('isReturnEligible false if order not delivered', () => {
    expect(isReturnEligible({ status: 'processing', deliveredAt: '2026-06-20' })).toBe(false)
  })

  test('validateReturnForm fails with no reason selected', () => {
    expect(validateReturnForm({ items: [{ quantity: 1, orderedQuantity: 1 }], evidence: ['img'] })).toBe(false)
  })

  test('validateReturnForm fails with quantity > ordered quantity', () => {
    expect(validateReturnForm({ reason: 'defective', items: [{ quantity: 2, orderedQuantity: 1 }], evidence: ['img'] })).toBe(false)
  })

  test('validateReturnForm fails with no items selected', () => {
    expect(validateReturnForm({ reason: 'defective', items: [], evidence: ['img'] })).toBe(false)
  })

  test('validateReturnPhoto rejects non-image files', () => {
    expect(validateReturnPhoto({ type: 'application/pdf', size: 1000 })).toBe(false)
  })

  test('validateReturnPhoto rejects files > size limit', () => {
    expect(validateReturnPhoto({ type: 'image/png', size: 6 * 1024 * 1024 })).toBe(false)
  })

  test('calculateRefundAmount correct for full return', () => {
    expect(calculateRefundAmount({ unitPrice: 100000, quantity: 2, discountAllocation: 20000 }, 2)).toBe(180000)
  })

  test('calculateRefundAmount correct for partial return', () => {
    expect(calculateRefundAmount({ unitPrice: 100000, quantity: 2, discountAllocation: 20000 }, 1)).toBe(90000)
  })
})
