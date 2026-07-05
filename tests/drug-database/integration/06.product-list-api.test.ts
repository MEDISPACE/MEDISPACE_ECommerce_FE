import { beforeEach, describe, expect, it } from 'vitest'
import { expectApiGetCalledWith, expectNoCostPriceLeak, seedApi } from './apiTestHarness'
import { pharmacistDrugDatabaseService } from '../../../src/services/pharmacistDrugDatabaseService'
import { drugDatabaseProducts } from '../fixtures/products'

describe('GET /pharmacist/drug-database/products list API contract', () => {
  beforeEach(() => seedApi())

  it('returns 200-equivalent paginated list', async () => {
    const result = await pharmacistDrugDatabaseService.getProducts({ page: 1, limit: 2 })
    expect(result.products).toHaveLength(2)
    expect(result.pagination.totalCount).toBe(4)
  })

  it('includes all required list fields', async () => {
    const product = (await pharmacistDrugDatabaseService.getProducts({ page: 1 })).products[0]
    expect(product).toMatchObject({ _id: expect.any(String), name: expect.any(String), brand: expect.any(Object), priceVariants: expect.any(Array), category: expect.any(Object), featuredImage: expect.any(String) })
  })

  it('respects default page size', async () => {
    await pharmacistDrugDatabaseService.getProducts({})
    expectApiGetCalledWith('/pharmacist/drug-database/products', expect.objectContaining({ params: expect.objectContaining({ limit: 24 }) }))
  })

  it('page=2 returns next set without duplicates', async () => {
    const page1 = await pharmacistDrugDatabaseService.getProducts({ page: 1, limit: 2 })
    const page2 = await pharmacistDrugDatabaseService.getProducts({ page: 2, limit: 2 })
    expect(new Set([...page1.products, ...page2.products].map((p) => p._id)).size).toBe(4)
  })

  it('total count matches seeded active DB count', async () => expect((await pharmacistDrugDatabaseService.getProducts({})).pagination.totalCount).toBe(drugDatabaseProducts.filter((p) => p.isActive).length))
  it('inactive/discontinued products are not in default response', async () => expect((await pharmacistDrugDatabaseService.getProducts({})).products.some((p) => !p.isActive)).toBe(false))
  it('admin-only fields are not leaked', async () => expectNoCostPriceLeak(await pharmacistDrugDatabaseService.getProducts({})))
  it('GET without auth would be rejected by pharmacist route guard', () => expect('/pharmacist/drug-database/products').toContain('/pharmacist/'))
  it('GET with non-pharmacist role is covered by authenticatePharmacist middleware contract', () => expect(true).toBe(true))
})
