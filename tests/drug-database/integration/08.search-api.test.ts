import { beforeEach, describe, expect, it } from 'vitest'
import { seedApi } from './apiTestHarness'
import { pharmacistDrugDatabaseService } from '../../../src/services/pharmacistDrugDatabaseService'

describe('drug database search API contract', () => {
  beforeEach(() => seedApi())
  it('search by product name finds correct products', async () => expect((await pharmacistDrugDatabaseService.getProducts({ search: 'Paracetamol' })).products[0].name).toContain('Paracetamol'))
  it('search by active ingredient finds products', async () => expect((await pharmacistDrugDatabaseService.getProducts({ search: 'Amoxicillin' })).products[0].details?.activeIngredients).toContain('Amoxicillin'))
  it('search by brand name finds products', async () => expect((await pharmacistDrugDatabaseService.getProducts({ search: 'Aenova' })).products.length).toBeGreaterThan(0))
  it('partial name finds matches', async () => expect((await pharmacistDrugDatabaseService.getProducts({ search: 'Par' })).products.length).toBeGreaterThan(0))
  it('search is case-insensitive', async () => expect((await pharmacistDrugDatabaseService.getProducts({ search: 'paracetamol' })).products.length).toBeGreaterThan(0))
  it('Vietnamese/non-diacritic query path is accepted', async () => expect((await pharmacistDrugDatabaseService.getProducts({ search: 'vitamin c' })).products[0].name).toContain('Vitamin C'))
  it('search with special chars does not crash', async () => await expect(pharmacistDrugDatabaseService.getProducts({ search: '/ + %' })).resolves.toBeTruthy())
  it('empty search returns all', async () => expect((await pharmacistDrugDatabaseService.getProducts({ search: '' })).products.length).toBeGreaterThan(1))
  it('no matches returns empty array', async () => expect((await pharmacistDrugDatabaseService.getProducts({ search: 'no-such-drug' })).products).toHaveLength(0))
  it('long search string is handled gracefully', async () => await expect(pharmacistDrugDatabaseService.getProducts({ search: 'a'.repeat(220) })).resolves.toBeTruthy())
})
