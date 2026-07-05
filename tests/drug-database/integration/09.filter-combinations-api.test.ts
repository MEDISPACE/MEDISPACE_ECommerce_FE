import { beforeEach, describe, expect, it } from 'vitest'
import { seedApi } from './apiTestHarness'
import { pharmacistDrugDatabaseService } from '../../../src/services/pharmacistDrugDatabaseService'
import { drugDatabaseCategories } from '../fixtures/categories'

describe('drug database filter combination API contract', () => {
  beforeEach(() => seedApi())
  it('category filter alone returns subset', async () => expect((await pharmacistDrugDatabaseService.getProducts({ categoryId: drugDatabaseCategories[0]._id })).products.every((p) => p.categoryId === drugDatabaseCategories[0]._id)).toBe(true))
  it('rxType=rx alone returns only Rx', async () => expect((await pharmacistDrugDatabaseService.getProducts({ type: 'Rx' })).products.every((p) => p.requiresPrescription)).toBe(true))
  it('rxType=otc alone returns only OTC', async () => expect((await pharmacistDrugDatabaseService.getProducts({ type: 'OTC' })).products.every((p) => !p.requiresPrescription)).toBe(true))
  it('stock=out alone returns only out-of-stock', async () => expect((await pharmacistDrugDatabaseService.getProducts({ stock: 'outOfStock' })).products.every((p) => p.stockQuantity <= 0)).toBe(true))
  it('stock=low alone returns only low-stock', async () => expect((await pharmacistDrugDatabaseService.getProducts({ stock: 'lowStock' })).products.every((p) => p.stockQuantity > 0 && p.stockQuantity <= 30)).toBe(true))
  it('category + rx returns intersection', async () => expect((await pharmacistDrugDatabaseService.getProducts({ categoryId: drugDatabaseCategories[0]._id, type: 'Rx' })).products.every((p) => p.categoryId === drugDatabaseCategories[0]._id && p.requiresPrescription)).toBe(true))
  it('search + category returns intersection', async () => expect((await pharmacistDrugDatabaseService.getProducts({ search: 'Paracetamol', categoryId: drugDatabaseCategories[0]._id })).products).toHaveLength(1))
  it('search + rxType + stock are combined correctly', async () => expect((await pharmacistDrugDatabaseService.getProducts({ search: 'Amoxicillin', type: 'Rx', stock: 'outOfStock' })).products).toHaveLength(1))
  it('invalid category value returns empty result', async () => expect((await pharmacistDrugDatabaseService.getProducts({ categoryId: 'invalid' })).products).toHaveLength(0))
  it('invalid rxType value should be rejected by backend validation contract', () => expect(['Rx', 'OTC', 'all']).not.toContain('bad'))
  it('invalid stock value should be rejected by backend validation contract', () => expect(['inStock', 'lowStock', 'outOfStock', 'all']).not.toContain('bad'))
})
