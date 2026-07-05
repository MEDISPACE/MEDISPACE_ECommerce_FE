import { describe, expect, it } from 'vitest'
import { formatActiveIngredient, formatDosageForm, formatLastUpdated, formatManufacturer, isDataComplete, truncateDescription } from '../../../src/utils/drugDatabaseUtils'
import { drugDatabaseProducts } from '../fixtures/products'

describe('drug database data formatting', () => {
  it('formatActiveIngredient() handles array', () => expect(formatActiveIngredient(['A', 'B'])).toBe('A, B'))
  it('formatActiveIngredient() handles single string', () => expect(formatActiveIngredient('Paracetamol')).toBe('Paracetamol'))
  it('formatActiveIngredient() handles null', () => expect(formatActiveIngredient(null)).toBe('Không có thông tin'))
  it('formatDosageForm() maps enum values to Vietnamese labels', () => expect(formatDosageForm('tablet')).toBe('Viên nén'))
  it('formatManufacturer() handles missing manufacturer gracefully', () => expect(formatManufacturer('')).toBe('Không có thông tin'))
  it('formatLastUpdated() shows relative time correctly', () => expect(formatLastUpdated('2026-07-05T00:00:00.000Z', new Date('2026-07-05T02:00:00.000Z'))).toBe('2 giờ trước'))
  it('isDataComplete() returns true when all key fields present', () => expect(isDataComplete(drugDatabaseProducts[0] as any).complete).toBe(true))
  it('isDataComplete() returns false and lists missing fields', () => {
    const result = isDataComplete(drugDatabaseProducts[3] as any)
    expect(result.complete).toBe(false)
    expect(result.missingFields).toContain('activeIngredients')
  })
  it('truncateDescription() cuts at word boundary', () => expect(truncateDescription('Một mô tả thuốc rất dài', 12)).toBe('Một mô tả...'))
})
