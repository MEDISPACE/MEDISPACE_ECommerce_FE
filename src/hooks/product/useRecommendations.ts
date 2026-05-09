/**
 * useRecommendations — Custom hooks for ML Recommendation data
 * Mỗi hook tự quản lý loading state và error, trả về products[]
 */

import { useState, useEffect } from 'react'
import { recommendationService } from '../../services/recommendationService'
import type { RecommendedProduct } from '../../services/recommendationService'

interface UseRecommendationResult {
  products: RecommendedProduct[]
  loading: boolean
  algorithm: string
}

// ─── useTrending ──────────────────────────────────────────────────────────────

export function useTrending(limit = 12, categoryId?: string): UseRecommendationResult {
  const [products, setProducts] = useState<RecommendedProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [algorithm, setAlgorithm] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    recommendationService.getTrending(limit, categoryId).then((res) => {
      if (!cancelled) {
        setProducts(res.products)
        setAlgorithm(res.algorithm)
        setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [limit, categoryId])

  return { products, loading, algorithm }
}

// ─── useForYou ────────────────────────────────────────────────────────────────

export function useForYou(limit = 12, isAuthenticated = false): UseRecommendationResult {
  const [products, setProducts] = useState<RecommendedProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [algorithm, setAlgorithm] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    const fetch = async () => {
      if (isAuthenticated) {
        // Personalized — requires auth token
        const res = await recommendationService.getForYou(limit)
        if (!cancelled) {
          setProducts(res.products)
          setAlgorithm(res.algorithm)
        }
      } else {
        // Fallback: show trending for guest users
        const res = await recommendationService.getTrending(limit)
        if (!cancelled) {
          setProducts(res.products)
          setAlgorithm('trending_fallback')
        }
      }
      if (!cancelled) setLoading(false)
    }

    fetch()
    return () => { cancelled = true }
  }, [limit, isAuthenticated])

  return { products, loading, algorithm }
}

// ─── useRelated ───────────────────────────────────────────────────────────────

export function useRelated(productId: string, limit = 8): UseRecommendationResult {
  const [products, setProducts] = useState<RecommendedProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [algorithm, setAlgorithm] = useState('')

  useEffect(() => {
    if (!productId) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    recommendationService.getRelated(productId, limit).then((res) => {
      if (!cancelled) {
        setProducts(res.products)
        setAlgorithm(res.algorithm)
        setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [productId, limit])

  return { products, loading, algorithm }
}

// ─── useBoughtTogether ────────────────────────────────────────────────────────

export function useBoughtTogether(productId: string, limit = 6): UseRecommendationResult {
  const [products, setProducts] = useState<RecommendedProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [algorithm, setAlgorithm] = useState('')

  useEffect(() => {
    if (!productId) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    recommendationService.getBoughtTogether(productId, limit).then((res) => {
      if (!cancelled) {
        setProducts(res.products)
        setAlgorithm(res.algorithm)
        setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [productId, limit])

  return { products, loading, algorithm }
}

// ─── usePostPurchase ──────────────────────────────────────────────────────────

export function usePostPurchase(productIds: string[], limit = 8): UseRecommendationResult {
  const [products, setProducts] = useState<RecommendedProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [algorithm, setAlgorithm] = useState('')

  const key = productIds.join(',')

  useEffect(() => {
    if (!productIds || productIds.length === 0) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    recommendationService.getPostPurchase(productIds, limit).then((res) => {
      if (!cancelled) {
        setProducts(res.products)
        setAlgorithm(res.algorithm)
        setLoading(false)
      }
    })
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, limit])

  return { products, loading, algorithm }
}
