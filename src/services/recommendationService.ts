/**
 * RECOMMENDATION SERVICE
 * Proxy calls to BE /recommendations/* endpoints
 * BE sẽ enrich productIds từ ML Service thành full product objects
 */

import { apiClient } from './apiClient'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RecommendedProduct {
  _id: string
  name: string
  slug: string
  featuredImage?: string
  priceVariants: Array<{
    unit: string
    price: number
    originalPrice?: number
    salePrice?: number
    isDefault: boolean
    quantityPerUnit: number
  }>
  rating: number
  reviewCount: number
  stockQuantity: number
  requiresPrescription: boolean
  category?: Array<{ name: string }>
  brand?: Array<{ name: string }>
  recommendation?: {
    score: number | null
    reason: string
    evidence: string[]
    requiresIndependentReview?: boolean
  }
  attribution?: RecommendationAttribution
}

export interface RecommendationResult {
  requestId: string
  attributionToken: string
  algorithm: string
  modelVersion: string
  experiment: { id: string; variant: string }
  products: RecommendedProduct[]
}

export interface RecommendationEvent {
  productId: string
  algorithm: string
  section: string
  position: number
  eventType: 'impression' | 'click' | 'add_to_cart' | 'purchase' | 'dismiss' | 'snooze'
  requestId?: string
  attributionToken?: string
  modelVersion?: string
  experimentId?: string
  experimentVariant?: string
  value?: number
}

export interface RecommendationAttribution {
  requestId: string
  attributionToken: string
  modelVersion: string
  experimentId: string
  experimentVariant: string
}

const unavailable = (): RecommendationResult => ({
  requestId: '',
  attributionToken: '',
  algorithm: 'unavailable',
  modelVersion: 'unavailable',
  experiment: { id: 'none', variant: 'control' },
  products: [],
})

const attachAttribution = (result: RecommendationResult): RecommendationResult => ({
  ...result,
  products: result.products.map((product) => ({
    ...product,
    attribution: {
      requestId: result.requestId,
      attributionToken: result.attributionToken,
      modelVersion: result.modelVersion,
      experimentId: result.experiment.id,
      experimentVariant: result.experiment.variant,
    },
  })),
})

const ATTRIBUTION_STORAGE_KEY = 'medispace_recommendation_attribution'

const rememberAttribution = (event: RecommendationEvent) => {
  if (typeof window === 'undefined' || event.eventType !== 'add_to_cart' || !event.attributionToken) return
  const stored = JSON.parse(localStorage.getItem(ATTRIBUTION_STORAGE_KEY) || '{}')
  stored[event.productId] = { ...event, rememberedAt: Date.now() }
  localStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(stored))
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function safeGet<T>(url: string, params?: Record<string, unknown>): Promise<T | null> {
  try {
    const res = await apiClient.get<{ message: string; data: T }>(url, { params })
    return res.data?.data ?? null
  } catch {
    return null
  }
}

async function safePost<T>(url: string, body: unknown, params?: Record<string, unknown>): Promise<T | null> {
  try {
    const res = await apiClient.post<{ message: string; data: T }>(url, body, { params })
    return res.data?.data ?? null
  } catch {
    return null
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const recommendationService = {
  /**
   * Xu hướng bán chạy — NMF (public)
   * Dùng trên: HomePage "Xu Hướng Hôm Nay"
   */
  async getTrending(limit = 12, categoryId?: string): Promise<RecommendationResult> {
    const params: Record<string, unknown> = { limit }
    if (categoryId) params.categoryId = categoryId
    const data = await safeGet<RecommendationResult>('/recommendations/trending', params)
    return data ? attachAttribution(data) : unavailable()
  },

  /**
   * Gợi ý cá nhân hoá — SVD / NMF fallback (requires auth)
   * Dùng trên: HomePage "Dành Cho Bạn"
   */
  async getForYou(limit = 12): Promise<RecommendationResult> {
    const data = await safeGet<RecommendationResult>('/recommendations/for-you', { limit })
    return data ? attachAttribution(data) : unavailable()
  },

  /**
   * Sản phẩm liên quan — TF-IDF (public)
   * Dùng trên: ProductDetailPage
   */
  async getRelated(productId: string, limit = 8): Promise<RecommendationResult> {
    const data = await safeGet<RecommendationResult>(`/recommendations/related/${productId}`, { limit })
    return data ? attachAttribution(data) : unavailable()
  },

  /**
   * Thường mua kèm — FP-Growth / TF-IDF fallback (public)
   * Dùng trên: ProductDetailPage
   */
  async getBoughtTogether(productId: string, limit = 6): Promise<RecommendationResult> {
    const data = await safeGet<RecommendationResult>(`/recommendations/bought-together/${productId}`, { limit })
    return data ? attachAttribution(data) : unavailable()
  },

  /**
   * Gợi ý sau mua — Hybrid (public)
   * Dùng trên: OrderSuccessPage
   */
  async getPostPurchase(productIds: string[], limit = 8): Promise<RecommendationResult> {
    if (!productIds || productIds.length === 0) return unavailable()
    const data = await safePost<RecommendationResult>('/recommendations/post-purchase', { productIds }, { limit })
    return data ? attachAttribution(data) : unavailable()
  },

  /**
   * Gợi ý cho dược sĩ — TF-IDF medical context (requires auth)
   * Dùng trên: CreateOrderPage (Pharmacist)
   */
  async getPharmacistSuggestions(
    {
      chronicDiseases = [],
      allergies = [],
      currentMedications = [],
      prescriptionProductIds = [],
    }: {
      chronicDiseases?: string[]
      allergies?: string[]
      currentMedications?: string[]
      prescriptionProductIds?: string[]
    },
    limit = 10,
  ): Promise<RecommendationResult> {
    const data = await safePost<RecommendationResult>(
      '/recommendations/pharmacist',
      { chronicDiseases, allergies, currentMedications, prescriptionProductIds },
      { limit },
    )
    return data ? attachAttribution(data) : unavailable()
  },

  /**
   * Gợi ý tái đặt hàng — dựa trên lịch sử mua (requires auth)
   * Dùng trên: AccountDashboard
   */
  async getReplenishment(limit = 5): Promise<RecommendationResult> {
    const data = await safeGet<RecommendationResult>('/recommendations/replenishment', { limit })
    return data ? attachAttribution(data) : unavailable()
  },

  async trackEvent(event: RecommendationEvent): Promise<void> {
    rememberAttribution(event)
    await safePost('/recommendations/track', event)
  },

  async trackClick(event: Omit<RecommendationEvent, 'eventType'>): Promise<void> {
    await this.trackEvent({ ...event, eventType: 'click' })
  },

  async trackPurchases(productIds: string[]): Promise<void> {
    if (typeof window === 'undefined') return
    const stored = JSON.parse(localStorage.getItem(ATTRIBUTION_STORAGE_KEY) || '{}')
    await Promise.all(productIds.map(async (productId) => {
      const attribution = stored[productId] as RecommendationEvent | undefined
      if (!attribution) return
      await this.trackEvent({ ...attribution, productId, eventType: 'purchase' })
      delete stored[productId]
    }))
    localStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(stored))
  },
}

export default recommendationService
