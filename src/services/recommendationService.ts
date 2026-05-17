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
}

export interface RecommendationResult {
  algorithm: string
  products: RecommendedProduct[]
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
    return data ?? { algorithm: 'unavailable', products: [] }
  },

  /**
   * Gợi ý cá nhân hoá — SVD / NMF fallback (requires auth)
   * Dùng trên: HomePage "Dành Cho Bạn"
   */
  async getForYou(limit = 12): Promise<RecommendationResult> {
    const data = await safeGet<RecommendationResult>('/recommendations/for-you', { limit })
    return data ?? { algorithm: 'unavailable', products: [] }
  },

  /**
   * Sản phẩm liên quan — TF-IDF (public)
   * Dùng trên: ProductDetailPage
   */
  async getRelated(productId: string, limit = 8): Promise<RecommendationResult> {
    const data = await safeGet<RecommendationResult>(`/recommendations/related/${productId}`, { limit })
    return data ?? { algorithm: 'unavailable', products: [] }
  },

  /**
   * Thường mua kèm — FP-Growth / TF-IDF fallback (public)
   * Dùng trên: ProductDetailPage
   */
  async getBoughtTogether(productId: string, limit = 6): Promise<RecommendationResult> {
    const data = await safeGet<RecommendationResult>(`/recommendations/bought-together/${productId}`, { limit })
    return data ?? { algorithm: 'unavailable', products: [] }
  },

  /**
   * Gợi ý sau mua — Hybrid (public)
   * Dùng trên: OrderSuccessPage
   */
  async getPostPurchase(productIds: string[], limit = 8): Promise<RecommendationResult> {
    if (!productIds || productIds.length === 0) return { algorithm: 'unavailable', products: [] }
    const data = await safePost<RecommendationResult>('/recommendations/post-purchase', { productIds }, { limit })
    return data ?? { algorithm: 'unavailable', products: [] }
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
    return data ?? { algorithm: 'unavailable', products: [] }
  },

  /**
   * Gợi ý tái đặt hàng — dựa trên lịch sử mua (requires auth)
   * Dùng trên: AccountDashboard
   */
  async getReplenishment(limit = 5): Promise<RecommendationResult> {
    const data = await safeGet<RecommendationResult>('/recommendations/replenishment', { limit })
    return data ?? { algorithm: 'unavailable', products: [] }
  },
}

export default recommendationService
