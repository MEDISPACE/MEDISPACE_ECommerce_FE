import { describe, expect, it } from 'vitest'
import { filterByRxType, getRxBadgeConfig, isRxProduct } from '../../../src/utils/drugDatabaseUtils'
import { drugDatabaseProducts } from '../fixtures/products'

describe('drug database Rx/OTC classification', () => {
  it('isRxProduct() returns true for rxType === rx', () => expect(isRxProduct({ rxType: 'rx' })).toBe(true))
  it('isRxProduct() returns false for rxType === otc', () => expect(isRxProduct({ rxType: 'otc' })).toBe(false))
  it('isRxProduct() handles null/undefined rxType as OTC', () => {
    expect(isRxProduct(null)).toBe(false)
    expect(isRxProduct({})).toBe(false)
  })
  it('getRxBadgeConfig() returns correct color/label for Rx', () => expect(getRxBadgeConfig({ requiresPrescription: true }).label).toContain('Rx'))
  it('getRxBadgeConfig() returns correct color/label for OTC', () => expect(getRxBadgeConfig({ requiresPrescription: false }).label).toContain('OTC'))
  it('filterByRxType(rx) returns only Rx products', () => expect(filterByRxType(drugDatabaseProducts as any, 'rx').every((p) => p.requiresPrescription)).toBe(true))
  it('filterByRxType(otc) returns only OTC products', () => expect(filterByRxType(drugDatabaseProducts as any, 'otc').every((p) => !p.requiresPrescription)).toBe(true))
  it('filterByRxType(all) returns all products', () => expect(filterByRxType(drugDatabaseProducts as any, 'all')).toHaveLength(drugDatabaseProducts.length))
})
