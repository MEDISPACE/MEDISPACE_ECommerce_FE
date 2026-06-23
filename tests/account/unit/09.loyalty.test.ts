import { describe, expect, test } from 'vitest'
import { calculatePointsEarned, calculatePointsExpiry, filterHistory, formatPointsChange, getTierLevel, isPointsExpiringSoon, sortHistory } from '../helpers/account-unit'
import { loyalty } from '../fixtures/loyalty'

describe('account loyalty unit rules', () => {
  test('calculatePointsEarned correct per order total', () => {
    expect(calculatePointsEarned(250000, 1000, 1)).toBe(250)
  })

  test('calculatePointsExpiry correct date from earn date', () => {
    expect(calculatePointsExpiry('2026-06-23T00:00:00.000Z', 7)).toContain('2026-06-30')
  })

  test('isPointsExpiringSoon true if < 7 days', () => {
    expect(isPointsExpiringSoon('2026-06-27', new Date('2026-06-23'))).toBe(true)
  })

  test('filterHistory by type', () => {
    expect(filterHistory(loyalty.withHistory.transactions, 'earned')).toHaveLength(1)
  })

  test('sortHistory by date descending', () => {
    expect(sortHistory(loyalty.withHistory.transactions)[0].id).toBe('loyalty-3')
  })

  test('getTierLevel returns correct tier per point balance', () => {
    expect(getTierLevel(12000)).toBe('gold')
  })

  test('formatPointsChange shows +/- correctly', () => {
    expect(formatPointsChange(10)).toBe('+10')
    expect(formatPointsChange(-5)).toBe('-5')
  })
})
