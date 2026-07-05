import { beforeEach, describe, expect, it } from 'vitest'
import { expectNoCostPriceLeak, seedApi } from './apiTestHarness'
import { pharmacistDrugDatabaseService } from '../../../src/services/pharmacistDrugDatabaseService'
import { drugDatabaseProducts } from '../fixtures/products'

describe('GET /pharmacist/drug-database/products/:id detail API contract', () => {
  beforeEach(() => seedApi(drugDatabaseProducts))
  it('returns full detail by id', async () => expect(await pharmacistDrugDatabaseService.getProduct(drugDatabaseProducts[0]._id)).toMatchObject({ details: expect.objectContaining({ activeIngredients: 'Paracetamol' }) }))
  it('includes medical, stock, and price fields', async () => {
    const product = await pharmacistDrugDatabaseService.getProduct(drugDatabaseProducts[2]._id)
    expect(product).toMatchObject({ sku: 'AMOX-500', stockQuantity: 0, priceVariants: expect.any(Array), warnings: expect.any(Array) })
  })
  it('product with missing optional fields returns nullable/empty values without crash', async () => expect((await pharmacistDrugDatabaseService.getProduct(drugDatabaseProducts[3]._id)).details).toBeTruthy())
  it('non-existent productId rejects as 404', async () => await expect(pharmacistDrugDatabaseService.getProduct('65f300000000000000000399')).rejects.toThrow())
  it('invalid ObjectId format is treated as not found by service boundary', async () => await expect(pharmacistDrugDatabaseService.getProduct('bad-id')).rejects.toThrow())
  it('inactive product can be flagged in response when explicitly fetched', async () => expect((await pharmacistDrugDatabaseService.getProduct(drugDatabaseProducts[4]._id)).isActive).toBe(false))
  it('Pharmacist A and B share the same reference product contract', async () => expect((await pharmacistDrugDatabaseService.getProduct(drugDatabaseProducts[0]._id))._id).toBe(drugDatabaseProducts[0]._id))
  it('admin-only cost price is not leaked', async () => expectNoCostPriceLeak(await pharmacistDrugDatabaseService.getProduct(drugDatabaseProducts[4]._id)))
})
