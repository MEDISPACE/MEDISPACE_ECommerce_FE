/**
 * useRecommendations — Custom hooks for ML Recommendation data
 * Recommendation hooks backed by TanStack Query cache.
 */

import { useQuery } from '@tanstack/react-query'
import { recommendationService } from '../../services/recommendationService'
import type { RecommendedProduct } from '../../services/recommendationService'

interface UseRecommendationResult {
  products: RecommendedProduct[]
  loading: boolean
  algorithm: string
}

function availableOnly(products: RecommendedProduct[]): RecommendedProduct[] {
  return products.filter((product) => product.stockQuantity > 0)
}

// ─── useTrending ──────────────────────────────────────────────────────────────

export function useTrending(limit = 12, categoryId?: string): UseRecommendationResult {
  const query = useQuery({
    queryKey: ['recommendations', 'trending', limit, categoryId ?? null],
    queryFn: () => recommendationService.getTrending(limit, categoryId),
  })

  return {
    products: availableOnly(query.data?.products ?? []),
    loading: query.isLoading,
    algorithm: query.data?.algorithm ?? '',
  }
}

// ─── useForYou ────────────────────────────────────────────────────────────────

export function useForYou(limit = 12, isAuthenticated = false): UseRecommendationResult {
  const query = useQuery({
    queryKey: ['recommendations', isAuthenticated ? 'for-you' : 'for-you-trending-fallback', limit],
    queryFn: async () => {
      if (isAuthenticated) return recommendationService.getForYou(limit)
      const res = await recommendationService.getTrending(limit)
      return { ...res, algorithm: 'trending_fallback' }
    },
  })

  return {
    products: availableOnly(query.data?.products ?? []),
    loading: query.isLoading,
    algorithm: query.data?.algorithm ?? '',
  }
}

// ─── useRelated ───────────────────────────────────────────────────────────────

export function useRelated(productId: string, limit = 8): UseRecommendationResult {
  const query = useQuery({
    queryKey: ['recommendations', 'related', productId, limit],
    queryFn: () => recommendationService.getRelated(productId, limit),
    enabled: Boolean(productId),
  })

  return {
    products: availableOnly(query.data?.products ?? []),
    loading: query.isLoading,
    algorithm: query.data?.algorithm ?? '',
  }
}

// ─── useBoughtTogether ────────────────────────────────────────────────────────

export function useBoughtTogether(productId: string, limit = 6): UseRecommendationResult {
  const query = useQuery({
    queryKey: ['recommendations', 'bought-together', productId, limit],
    queryFn: () => recommendationService.getBoughtTogether(productId, limit),
    enabled: Boolean(productId),
  })

  return {
    products: availableOnly(query.data?.products ?? []),
    loading: query.isLoading,
    algorithm: query.data?.algorithm ?? '',
  }
}

// ─── usePostPurchase ──────────────────────────────────────────────────────────

export function usePostPurchase(productIds: string[], limit = 8): UseRecommendationResult {
  const key = productIds.join(',')
  const query = useQuery({
    queryKey: ['recommendations', 'post-purchase', key, limit],
    queryFn: () => recommendationService.getPostPurchase(productIds, limit),
    enabled: productIds.length > 0,
  })

  return {
    products: availableOnly(query.data?.products ?? []),
    loading: query.isLoading,
    algorithm: query.data?.algorithm ?? '',
  }
}

// ─── useReplenishment ─────────────────────────────────────────────────────────

export function useReplenishment(limit = 5, isAuthenticated = false): UseRecommendationResult {
  const query = useQuery({
    queryKey: ['recommendations', 'replenishment', limit],
    queryFn: () => recommendationService.getReplenishment(limit),
    enabled: isAuthenticated,
  })

  return {
    products: availableOnly(query.data?.products ?? []),
    loading: isAuthenticated ? query.isLoading : false,
    algorithm: query.data?.algorithm ?? '',
  }
}
