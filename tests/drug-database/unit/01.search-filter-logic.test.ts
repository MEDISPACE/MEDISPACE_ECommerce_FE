import { describe, expect, it } from 'vitest'
import { buildFilterQuery, buildSearchQuery, paginateQuery, sanitizeSearchTerm } from '../../../src/utils/drugDatabaseUtils'

describe('drug database search/filter logic', () => {
  it('buildSearchQuery() with name only returns correct query shape', () => {
    expect(buildSearchQuery('Paracetamol', ['name'])).toEqual({ $or: [{ name: { $regex: 'Paracetamol', $options: 'i' } }] })
  })

  it('buildSearchQuery() with activeIngredient includes field', () => {
    expect(buildSearchQuery('Amoxicillin', ['activeIngredients']).$or).toEqual([{ activeIngredients: { $regex: 'Amoxicillin', $options: 'i' } }])
  })

  it('buildSearchQuery() with brand includes field', () => {
    expect(buildSearchQuery('Aenova', ['brand']).$or).toEqual([{ brand: { $regex: 'Aenova', $options: 'i' } }])
  })

  it('buildSearchQuery() with empty string adds no search filter', () => {
    expect(buildSearchQuery('   ')).toEqual({})
  })

  it('buildSearchQuery() with special chars is sanitized', () => {
    expect(sanitizeSearchTerm('vitamin c / + % (test)')).toBe('vitamin c / \\+ % \\(test\\)')
  })

  it('buildFilterQuery() with category returns correct filter', () => {
    expect(buildFilterQuery({ category: 'cat-1' })).toEqual({ categoryId: 'cat-1' })
  })

  it('buildFilterQuery() with rxType=rx returns correct filter', () => {
    expect(buildFilterQuery({ rxType: 'rx' })).toEqual({ requiresPrescription: true })
  })

  it('buildFilterQuery() with rxType=otc returns correct filter', () => {
    expect(buildFilterQuery({ rxType: 'otc' })).toEqual({ requiresPrescription: false })
  })

  it('buildFilterQuery() with stock=out uses stock=0 filter', () => {
    expect(buildFilterQuery({ stock: 'out' })).toEqual({ stockQuantity: { $eq: 0 } })
  })

  it('buildFilterQuery() with stock=low uses threshold filter', () => {
    expect(buildFilterQuery({ stock: 'low', threshold: 10 })).toEqual({ stockQuantity: { $gt: 0, $lte: 10 } })
  })

  it('buildFilterQuery() combining all filters applies AND-compatible object', () => {
    expect(buildFilterQuery({ category: 'cat-1', rxType: 'rx', stock: 'low', threshold: 5 })).toEqual({
      categoryId: 'cat-1',
      requiresPrescription: true,
      stockQuantity: { $gt: 0, $lte: 5 },
    })
  })

  it('paginateQuery() calculates skip/limit for pages 1, 2, 3', () => {
    expect(paginateQuery(1, 20)).toEqual({ skip: 0, limit: 20 })
    expect(paginateQuery(2, 20)).toEqual({ skip: 20, limit: 20 })
    expect(paginateQuery(3, 20)).toEqual({ skip: 40, limit: 20 })
  })
})
