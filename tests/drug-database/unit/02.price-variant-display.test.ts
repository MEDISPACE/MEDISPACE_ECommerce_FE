import { describe, expect, it } from 'vitest'
import { formatCurrency, formatPriceVariants, getDisplayPrice, getPriceForUnit } from '../../../src/utils/drugDatabaseUtils'
import { drugDatabaseProducts } from '../fixtures/products'

describe('drug database price variant display', () => {
  it('getDisplayPrice() returns lowest-price variant for list view', () => {
    expect(getDisplayPrice(drugDatabaseProducts[0] as any)).toMatchObject({ price: 1200, unit: 'Viên' })
  })

  it('getDisplayPrice() includes unit label', () => {
    expect(getDisplayPrice(drugDatabaseProducts[0] as any).label).toBe('1.200đ / Viên')
  })

  it('formatPriceVariants() returns all variants sorted by price', () => {
    const variants = formatPriceVariants(drugDatabaseProducts[0].priceVariants as any)
    expect(variants.map((variant) => variant.unit)).toEqual(['Viên', 'Hộp'])
  })

  it('formatPriceVariants() with single variant is clear', () => {
    expect(formatPriceVariants(drugDatabaseProducts[1].priceVariants as any)).toHaveLength(1)
  })

  it('formatPriceVariants() with empty variants returns fallback', () => {
    expect(formatPriceVariants([])[0].label).toBe('Chưa có giá')
  })

  it('getPriceForUnit() returns correct price for unit type', () => {
    expect(getPriceForUnit(drugDatabaseProducts[0].priceVariants as any, 'Hộp')).toBe(56000)
  })

  it('formatCurrency() formats Vietnamese dong correctly', () => {
    expect(formatCurrency(1234567)).toBe('1.234.567đ')
  })
})
