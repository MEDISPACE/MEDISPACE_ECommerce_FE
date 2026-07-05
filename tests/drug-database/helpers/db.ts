import type { Page } from '@playwright/test'
import { drugDatabaseProducts } from '../fixtures/products'
import { drugDatabaseCategories } from '../fixtures/categories'

const LOW_STOCK_THRESHOLD = 30

export async function seedDrugDatabase() {
  return { products: [...drugDatabaseProducts], categories: [...drugDatabaseCategories], lowStockThreshold: LOW_STOCK_THRESHOLD }
}

export async function cleanDrugDatabase() {
  return true
}

export function buildDrugDatabaseApiResult(overrides?: { products?: any[]; page?: number; limit?: number }) {
  const page = overrides?.page || 1
  const limit = overrides?.limit || 24
  const products = overrides?.products || drugDatabaseProducts.filter((product) => product.isActive)
  return {
    message: 'Get pharmacist drug database products successfully',
    result: {
      products: products.slice((page - 1) * limit, page * limit),
      pagination: { page, limit, totalPages: Math.ceil(products.length / limit), totalCount: products.length },
      lowStockThreshold: LOW_STOCK_THRESHOLD,
      searchSource: 'mongo',
      lastCheckedAt: new Date('2026-07-05T00:00:00.000Z').toISOString(),
    },
  }
}

export async function mockDrugDatabaseRoutes(page: Page, products = drugDatabaseProducts.filter((product) => product.isActive)) {
  await page.route('**/users/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        result: {
          _id: '65f900000000000000000901',
          id: '65f900000000000000000901',
          email: 'pharmacist.a@medispace.test',
          firstName: 'Pharma',
          lastName: 'A',
          role: 1,
          isOnline: true,
          status: 'active',
        },
      }),
    })
  })

  await page.route('**/pharmacist/dashboard/stats', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ result: { pendingPrescriptions: 0, prescriptionsToday: { total: 0, verified: 0, rejected: 0 }, ordersToday: 0, totalRevenue: 0, activeChats: 0 } }),
    })
  })

  await page.route('**/search/products**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ hits: [], found: 0, source: 'mock' }) })
  })

  await page.route('**/pharmacist/patients/search**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ result: [] }) })
  })

  await page.route('**/pharmacist/online-status', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ result: { isOnline: true } }) })
  })

  await page.route('**/notifications/unread-count', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ result: { count: 0 } }) })
  })

  await page.route('**/notifications**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ result: [], pagination: { page: 1, total: 0 } }) })
  })

  await page.route('**/categories**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ result: { categories: drugDatabaseCategories } }) })
  })

  await page.route('**/pharmacist/drug-database/products**', async (route) => {
    const url = new URL(route.request().url())
    const detailMatch = url.pathname.match(/\/pharmacist\/drug-database\/products\/([^/]+)$/)
    if (detailMatch) {
      const id = detailMatch[1]
      const product = products.find((item) => item._id === id || item.slug === id)
      if (!product) {
        await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ message: 'Product not found' }) })
        return
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ result: product }) })
      return
    }

    let filtered = [...products]
    const search = url.searchParams.get('search')?.toLowerCase()
    const categoryId = url.searchParams.get('categoryId')
    const type = url.searchParams.get('type')
    const stock = url.searchParams.get('stock')
    const pageNumber = Number(url.searchParams.get('page') || 1)
    const limit = Number(url.searchParams.get('limit') || 24)

    if (search) {
      filtered = filtered.filter((product) =>
        [product.name, product.shortDescription, product.brand?.name, product.details?.activeIngredients]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(search),
      )
    }
    if (categoryId) filtered = filtered.filter((product) => product.categoryId === categoryId)
    if (type === 'Rx') filtered = filtered.filter((product) => product.requiresPrescription)
    if (type === 'OTC') filtered = filtered.filter((product) => !product.requiresPrescription)
    if (stock === 'outOfStock') filtered = filtered.filter((product) => product.stockQuantity <= 0)
    if (stock === 'lowStock') filtered = filtered.filter((product) => product.stockQuantity > 0 && product.stockQuantity <= LOW_STOCK_THRESHOLD)

    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(buildDrugDatabaseApiResult({ products: filtered, page: pageNumber, limit })) })
  })
}
