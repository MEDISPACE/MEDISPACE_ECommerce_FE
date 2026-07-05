import { expect, vi } from 'vitest'
import { drugDatabaseProducts } from '../fixtures/products'
import { buildDrugDatabaseApiResult } from '../helpers/db'

const mocks = vi.hoisted(() => ({ apiGetMock: vi.fn() }))

vi.mock('../../../src/services/apiClient', () => ({
  apiClient: { get: mocks.apiGetMock },
}))

export function seedApi(products = drugDatabaseProducts.filter((product) => product.isActive)) {
  mocks.apiGetMock.mockReset()
  mocks.apiGetMock.mockImplementation((url: string, config?: { params?: Record<string, any> }) => {
    if (!url.startsWith('/pharmacist/drug-database/products')) return Promise.reject(new Error('Unexpected URL'))
    const id = url.split('/pharmacist/drug-database/products/')[1]
    if (id) {
      const product = products.find((item) => item._id === id || item.slug === id)
      if (!product) return Promise.reject(Object.assign(new Error('Product not found'), { response: { status: 404 } }))
      return Promise.resolve({ data: { result: stripAdminFields(product) } })
    }

    const params = config?.params || {}
    let filtered = [...products]
    if (params.search) {
      const q = String(params.search).toLowerCase()
      filtered = filtered.filter((product) => [product.name, product.brand?.name, product.details?.activeIngredients].join(' ').toLowerCase().includes(q))
    }
    if (params.categoryId) filtered = filtered.filter((product) => product.categoryId === params.categoryId)
    if (params.type === 'Rx') filtered = filtered.filter((product) => product.requiresPrescription)
    if (params.type === 'OTC') filtered = filtered.filter((product) => !product.requiresPrescription)
    if (params.stock === 'outOfStock') filtered = filtered.filter((product) => product.stockQuantity <= 0)
    if (params.stock === 'lowStock') filtered = filtered.filter((product) => product.stockQuantity > 0 && product.stockQuantity <= 30)
    return Promise.resolve({ data: buildDrugDatabaseApiResult({ products: filtered, page: Number(params.page || 1), limit: Number(params.limit || 24) }) })
  })
}

function stripAdminFields(product: any) {
  return {
    ...product,
    priceVariants: (product.priceVariants || []).map(({ costPrice, ...variant }: any) => variant),
  }
}

export function expectApiGetCalledWith(...args: unknown[]) {
  expect(mocks.apiGetMock).toHaveBeenCalledWith(...args)
}

export function expectNoCostPriceLeak(value: unknown) {
  expect(JSON.stringify(value)).not.toContain('costPrice')
}
