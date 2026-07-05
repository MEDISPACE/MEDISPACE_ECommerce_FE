import { describe, expect, it } from 'vitest'
import { formatStockDisplay, getStockStatus, stockFilter } from '../../../src/utils/drugDatabaseUtils'
import { drugDatabaseProducts } from '../fixtures/products'

describe('drug database stock status logic', () => {
  it('getStockStatus() returns in_stock when stock > threshold', () => expect(getStockStatus(31, 30)).toBe('in_stock'))
  it('getStockStatus() returns low_stock when 0 < stock <= threshold', () => expect(getStockStatus(30, 30)).toBe('low_stock'))
  it('getStockStatus() returns out_of_stock when stock === 0', () => expect(getStockStatus(0, 30)).toBe('out_of_stock'))
  it('getStockStatus() handles null/undefined stock gracefully', () => {
    expect(getStockStatus(null)).toBe('out_of_stock')
    expect(getStockStatus(undefined)).toBe('out_of_stock')
  })
  it('formatStockDisplay() returns Còn X unit for in-stock', () => expect(formatStockDisplay(120, 'Viên', 30)).toBe('Còn 120 Viên'))
  it('formatStockDisplay() returns Sắp hết hàng for low stock', () => expect(formatStockDisplay(2, 'Hộp', 30)).toBe('Sắp hết hàng'))
  it('formatStockDisplay() returns Hết hàng for out of stock', () => expect(formatStockDisplay(0, 'Hộp', 30)).toBe('Hết hàng'))
  it('stockFilter(out) matches only stock === 0 exactly', () => expect(drugDatabaseProducts.filter(stockFilter('out'))).toHaveLength(1))
  it('stockFilter(low) matches stock > 0 AND <= threshold', () => expect(drugDatabaseProducts.filter(stockFilter('low', 30)).map((p) => p.sku)).toEqual(['VITC-1000', 'EYE-DROP', 'HOMA-1000']))
})
