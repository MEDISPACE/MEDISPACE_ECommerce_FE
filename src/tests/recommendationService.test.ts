// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'

const get = vi.fn()
const post = vi.fn()
const storage: Record<string, string> = {}

Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: (key: string) => storage[key] ?? null,
    setItem: (key: string, value: string) => { storage[key] = value },
    clear: () => Object.keys(storage).forEach((key) => delete storage[key]),
  },
  configurable: true,
})

vi.mock('../services/apiClient', () => ({
  apiClient: { get, post },
}))

const { recommendationService } = await import('../services/recommendationService')

describe('recommendationService attribution', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('attaches response attribution to every product', async () => {
    get.mockResolvedValueOnce({
      data: {
        data: {
          requestId: 'request-1',
          attributionToken: 'token-1',
          algorithm: 'nmf',
          modelVersion: 'v1',
          experiment: { id: 'exp-1', variant: 'control' },
          products: [{ _id: 'product-1', name: 'A', priceVariants: [] }],
        },
      },
    })

    const result = await recommendationService.getTrending()

    expect(result.products[0].attribution).toEqual({
      requestId: 'request-1',
      attributionToken: 'token-1',
      modelVersion: 'v1',
      experimentId: 'exp-1',
      experimentVariant: 'control',
    })
  })

  it('attributes a later purchase to a recommendation add-to-cart event', async () => {
    post.mockResolvedValue({ data: { data: null } })
    await recommendationService.trackEvent({
      productId: 'product-1',
      algorithm: 'nmf',
      section: 'for-you',
      position: 0,
      eventType: 'add_to_cart',
      attributionToken: 'token-1',
    })
    await recommendationService.trackPurchases(['product-1'])

    expect(post).toHaveBeenLastCalledWith(
      '/recommendations/track',
      expect.objectContaining({ productId: 'product-1', eventType: 'purchase', attributionToken: 'token-1' }),
      { params: undefined },
    )
  })
})
