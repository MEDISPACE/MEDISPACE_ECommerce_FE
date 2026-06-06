/**
 * Search E2E tests.
 *
 * Requires FE, BE, MongoDB and Typesense to be running with search data seeded.
 * Tests derive their assertions from live indexed documents instead of relying
 * on a specific product name existing in every environment.
 */

import { expect, test, type APIRequestContext, type Page } from '@playwright/test'

const APP_URL = process.env.E2E_BASE_URL || 'http://localhost:3000'
const API_URL = process.env.E2E_API_URL || 'http://localhost:8000'
const SEARCH_INPUT = 'input[placeholder*="Tìm thuốc"]'

type ProductDocument = {
  mongoId: string
  name: string
  slug: string
  sku?: string
  categoryId?: string
  brandId?: string
  requiresPrescription?: boolean
  isActive?: boolean
  inStock?: boolean
  stockQuantity?: number
  price?: number
  originalPrice?: number
  salePrice?: number
  priceVariantsJson?: string
  campaignName?: string
  campaignBadgeText?: string
}

type ProductSearchResponse = {
  source: 'typesense' | 'mongodb_fallback'
  hits: Array<{ document: ProductDocument }>
  found: number
  page: number
  facet_counts?: unknown[]
}

type ArticleDocument = {
  mongoId?: string
  title: string
  slug: string
}

type ArticleSearchResponse = {
  source?: 'typesense' | 'mongodb_fallback'
  hits: Array<{ document: ArticleDocument }>
  found: number
  page: number
}

let indexedProducts: ProductDocument[] = []
let exactProduct: ProductDocument
let accentedProduct: ProductDocument | undefined
let campaignProduct: ProductDocument | undefined
let indexedArticle: ArticleDocument | undefined

const withoutVietnameseMarks = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')

async function expectOkJson<T>(response: Awaited<ReturnType<APIRequestContext['get']>>): Promise<T> {
  expect(response.ok(), `${response.url()} returned ${response.status()}`).toBeTruthy()
  return response.json() as Promise<T>
}

async function searchProducts(request: APIRequestContext, params: Record<string, string | number | boolean>) {
  const query = new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)]))
  return expectOkJson<ProductSearchResponse>(await request.get(`${API_URL}/search/products?${query}`))
}

async function waitForProductSearch(page: Page, action: () => Promise<unknown>) {
  const responsePromise = page.waitForResponse(
    (response) => response.url().includes('/search/products') && response.request().method() === 'GET',
  )
  await action()
  const response = await responsePromise
  expect(response.ok()).toBeTruthy()
  return response
}

test.describe.serial('Typesense search system', () => {
  test.beforeAll(async ({ request }) => {
    const products = await searchProducts(request, { q: '*', limit: 100 })
    expect(products.source, 'E2E search suite requires Typesense to be available').toBe('typesense')
    expect(products.hits.length, 'Seed at least one searchable product before running E2E').toBeGreaterThan(0)

    indexedProducts = products.hits.map((hit) => hit.document)
    exactProduct = indexedProducts.find((product) => product.sku) || indexedProducts[0]
    accentedProduct = indexedProducts.find((product) => withoutVietnameseMarks(product.name) !== product.name)
    campaignProduct = indexedProducts.find((product) => product.campaignName && product.salePrice !== product.originalPrice)

    const articles = await expectOkJson<ArticleSearchResponse>(
      await request.get(`${API_URL}/search/articles?q=*&limit=10`),
    )
    indexedArticle = articles.hits[0]?.document
  })

  test('health endpoint reports a consistent Typesense read model', async ({ request }) => {
    const body = await expectOkJson<{
      typesense: boolean
      consistency: {
        healthy: boolean
        dirty: boolean
        consistent: boolean
        mismatchedCollections: string[]
        counts: Record<string, number>
      }
      mongoCounts: Record<string, number>
    }>(await request.get(`${API_URL}/search/status`))

    expect(body.typesense).toBe(true)
    expect(body.consistency).toMatchObject({
      healthy: true,
      dirty: false,
      consistent: true,
      mismatchedCollections: [],
    })
    expect(body.consistency.counts).toEqual(body.mongoCounts)
  })

  test('browse response has a stable public contract and no duplicate or private data', async ({ request }) => {
    const result = await searchProducts(request, { q: '*', limit: 100 })
    const ids = result.hits.map((hit) => hit.document.mongoId)
    const serialized = JSON.stringify(result)

    expect(result.source).toBe('typesense')
    expect(result.page).toBe(1)
    expect(result.found).toBeGreaterThanOrEqual(result.hits.length)
    expect(new Set(ids).size).toBe(ids.length)
    expect(result.hits.every((hit) => hit.document.isActive !== false)).toBe(true)
    expect(serialized).not.toContain('costPrice')
    expect(serialized).not.toContain('cost_price')

    for (const { document } of result.hits.filter((hit) => hit.document.priceVariantsJson)) {
      expect(() => JSON.parse(document.priceVariantsJson as string)).not.toThrow()
    }
  })

  test('exact product name and SKU both find the indexed product', async ({ request }) => {
    const byName = await searchProducts(request, { q: exactProduct.name, limit: 20 })
    expect(byName.hits.map((hit) => hit.document.mongoId)).toContain(exactProduct.mongoId)

    if (exactProduct.sku) {
      const bySku = await searchProducts(request, { q: exactProduct.sku, limit: 20 })
      expect(bySku.hits.map((hit) => hit.document.mongoId)).toContain(exactProduct.mongoId)
    }
  })

  test('Vietnamese unaccented query finds the same accented product', async ({ request }) => {
    test.skip(!accentedProduct, 'No indexed product with Vietnamese diacritics')
    const query = withoutVietnameseMarks(accentedProduct!.name)
    const result = await searchProducts(request, { q: query, limit: 50 })
    expect(result.hits.map((hit) => hit.document.mongoId)).toContain(accentedProduct!.mongoId)
  })

  test('brand, prescription and stock filters only return matching documents', async ({ request }) => {
    const filterProduct = indexedProducts.find((product) => product.brandId && product.inStock) || exactProduct
    const result = await searchProducts(request, {
      q: '*',
      limit: 100,
      ...(filterProduct.brandId ? { brandId: filterProduct.brandId } : {}),
      requiresPrescription: Boolean(filterProduct.requiresPrescription),
      inStock: true,
    })

    expect(result.hits.length).toBeGreaterThan(0)
    expect(
      result.hits.every(
        ({ document }) =>
          (!filterProduct.brandId || document.brandId === filterProduct.brandId) &&
          document.requiresPrescription === Boolean(filterProduct.requiresPrescription) &&
          document.inStock === true,
      ),
    ).toBe(true)
  })

  test('category filter includes the product assigned directly to that category', async ({ request }) => {
    test.skip(!exactProduct.categoryId, 'Indexed product has no categoryId')
    const result = await searchProducts(request, {
      q: exactProduct.name,
      categoryId: exactProduct.categoryId!,
      limit: 50,
    })
    expect(result.hits.map((hit) => hit.document.mongoId)).toContain(exactProduct.mongoId)
  })

  test('price sorting is monotonic and price range is enforced', async ({ request }) => {
    const asc = await searchProducts(request, { q: '*', sortBy: 'price_asc', limit: 100 })
    const desc = await searchProducts(request, { q: '*', sortBy: 'price_desc', limit: 100 })
    const pricesByPrescription = (result: ProductSearchResponse, requiresPrescription: boolean) =>
      result.hits
        .filter((hit) => Boolean(hit.document.requiresPrescription) === requiresPrescription)
        .map((hit) => hit.document.price ?? 0)
    const ascOtc = pricesByPrescription(asc, false)
    const ascRx = pricesByPrescription(asc, true)
    const descOtc = pricesByPrescription(desc, false)
    const descRx = pricesByPrescription(desc, true)
    const ascPrices = asc.hits.map((hit) => hit.document.price ?? 0)

    expect(ascOtc).toEqual([...ascOtc].sort((a, b) => a - b))
    expect(ascRx).toEqual([...ascRx].sort((a, b) => a - b))
    expect(descOtc).toEqual([...descOtc].sort((a, b) => b - a))
    expect(descRx).toEqual([...descRx].sort((a, b) => b - a))
    expect(asc.hits.map((hit) => Boolean(hit.document.requiresPrescription))).toEqual(
      [...asc.hits.map((hit) => Boolean(hit.document.requiresPrescription))].sort(),
    )

    const pivot = ascPrices[Math.floor(ascPrices.length / 2)]
    const ranged = await searchProducts(request, { q: '*', priceMin: pivot, priceMax: pivot, limit: 100 })
    expect(ranged.hits.every((hit) => hit.document.price === pivot)).toBe(true)
  })

  test('invalid pagination is clamped instead of causing a server error', async ({ request }) => {
    const result = await searchProducts(request, { q: '*', page: -10, limit: 1000 })
    expect(result.page).toBe(1)
    expect(result.hits.length).toBeLessThanOrEqual(100)
  })

  test('suggest enforces minimum query length, caps results and deduplicates products', async ({ request }) => {
    const short = await expectOkJson<{ products: unknown[]; brands: unknown[]; categories: unknown[]; articles: unknown[] }>(
      await request.get(`${API_URL}/search/suggest?q=a`),
    )
    expect(short).toEqual({ products: [], brands: [], categories: [], articles: [] })

    const token = exactProduct.name.split(/\s+/).find((part) => part.length >= 2) || exactProduct.name
    const result = await expectOkJson<{
      products: Array<{ document: ProductDocument }>
      brands: unknown[]
      categories: unknown[]
      articles: unknown[]
    }>(await request.get(`${API_URL}/search/suggest?q=${encodeURIComponent(token)}`))
    const productIds = result.products.map((hit) => hit.document.mongoId)

    expect(result.products.length).toBeLessThanOrEqual(15)
    expect(result.brands.length).toBeLessThanOrEqual(2)
    expect(result.categories.length).toBeLessThanOrEqual(2)
    expect(result.articles.length).toBeLessThanOrEqual(4)
    expect(new Set(productIds).size).toBe(productIds.length)
  })

  test('autocomplete renders a live suggestion and navigates to its product page', async ({ page }) => {
    await page.goto(APP_URL)
    const input = page.locator(SEARCH_INPUT).first()
    const suggestResponse = page.waitForResponse(
      (response) => response.url().includes('/search/suggest') && response.request().method() === 'GET',
    )

    await input.click()
    await input.fill(exactProduct.name)
    expect((await suggestResponse).ok()).toBeTruthy()

    const suggestion = page.getByText(exactProduct.name, { exact: true }).last()
    await expect(suggestion).toBeVisible()
    await suggestion.click()
    await expect(page).toHaveURL(new RegExp(`/products/${exactProduct.slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`))
  })

  test('article search finds an indexed article by exact title', async ({ request }) => {
    test.skip(!indexedArticle, 'No searchable article is indexed')
    const result = await expectOkJson<ArticleSearchResponse>(
      await request.get(`${API_URL}/search/articles?q=${encodeURIComponent(indexedArticle!.title)}&limit=20`),
    )
    expect(result.hits.map((hit) => hit.document.slug)).toContain(indexedArticle!.slug)
  })

  test('special regex-like query returns a valid search response', async ({ request }) => {
    const result = await searchProducts(request, { q: '(?:a){100000}', limit: 10 })
    expect(result.hits).toBeInstanceOf(Array)
    expect(result.found).toBeGreaterThanOrEqual(0)
  })

  test('search page renders the exact API result and result count', async ({ page }) => {
    const response = await waitForProductSearch(page, () =>
      page.goto(`${APP_URL}/search?q=${encodeURIComponent(exactProduct.name)}`),
    )
    const body = (await response.json()) as ProductSearchResponse

    await expect(page.getByTestId('search-result-count')).toHaveText(`Tìm thấy ${body.found} sản phẩm`)
    await expect(page.getByTestId('product-card').filter({ hasText: exactProduct.name }).first()).toBeVisible()
  })

  test('search UI sends server-side sort and renders sorted product cards', async ({ page }) => {
    await waitForProductSearch(page, () => page.goto(`${APP_URL}/search?q=*`))
    const response = await waitForProductSearch(page, async () => {
      await page.getByRole('combobox', { name: 'Sắp xếp kết quả' }).click()
      await page.getByRole('option', { name: 'Giá: Thấp đến cao' }).click()
    })

    expect(response.url()).toContain('sortBy=price_asc')
    await expect(page.getByTestId('product-card').first()).toBeVisible()
  })

  test('campaign fields map to visible sale UI when an active campaign exists', async ({ page }) => {
    test.skip(!campaignProduct, 'No active campaign product is indexed')
    await waitForProductSearch(page, () =>
      page.goto(`${APP_URL}/search?q=${encodeURIComponent(campaignProduct!.name)}`),
    )
    const card = page.getByTestId('product-card').filter({ hasText: campaignProduct!.name }).first()

    await expect(card).toBeVisible()
    await expect(card.locator('.line-through')).toBeVisible()
    await expect(card).toContainText(`${campaignProduct!.salePrice!.toLocaleString('vi-VN')}đ`)
    await expect(card).toContainText(`${campaignProduct!.originalPrice!.toLocaleString('vi-VN')}đ`)
  })

  test('empty search result shows the explicit empty state', async ({ page }) => {
    await waitForProductSearch(page, () => page.goto(`${APP_URL}/search?q=zzznotexistquery99999`))
    await expect(page.getByText('Không tìm thấy sản phẩm')).toBeVisible()
    await expect(page.getByTestId('search-result-count')).toHaveText('Tìm thấy 0 sản phẩm')
  })

  test('mobile search results do not overflow the viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await waitForProductSearch(page, () => page.goto(`${APP_URL}/search?q=*`))
    await expect(page.getByTestId('product-card').first()).toBeVisible()

    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
    }))
    expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport + 1)
  })
})
