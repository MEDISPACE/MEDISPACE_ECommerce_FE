import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { searchService } from '../services/searchService'

export interface SearchSuggestion {
  id: string
  text: string
  type: 'product' | 'category' | 'brand' | 'article'
  icon?: string
  image?: string
  slug?: string
  brandName?: string
  excerpt?: string
  productCount?: number
  requiresPrescription?: boolean
}

export interface GroupedSuggestions {
  products: SearchSuggestion[]
  brands: SearchSuggestion[]
  categories: SearchSuggestion[]
  articles: SearchSuggestion[]
  querySuggestions: string[]   // text completions: ["Paracetamol", "Panadol", ...]
  all: SearchSuggestion[]
  isLoading: boolean
  isSettled: boolean
}

export function useSearchSuggestions(query: string): GroupedSuggestions {
  const [debouncedQuery, setDebouncedQuery] = useState(query)

  // Debounce query — 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  // ── Typesense multi-collection suggest ──────────────────────────────────────
  const trimmedQuery = query.trim()
  const normalizedQuery = trimmedQuery.toLowerCase()
  const normalizedDebouncedQuery = debouncedQuery.trim().toLowerCase()

  const { data, isFetching, isPlaceholderData } = useQuery({
    queryKey: ['ts-suggest-multi', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery.trim() || debouncedQuery.length < 2) {
        return { products: [], brands: [], categories: [], articles: [], querySuggestions: [] }
      }
      return searchService.suggest(debouncedQuery)
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 30 * 1000, // 30s cache
    placeholderData: {
      products: [] as any[],
      brands: [] as any[],
      categories: [] as any[],
      articles: [] as any[],
      querySuggestions: [] as string[]
    },
  })

  const isWaitingForDebounce = trimmedQuery.length >= 2 && normalizedQuery !== normalizedDebouncedQuery
  const isLoading = trimmedQuery.length >= 2 && (isWaitingForDebounce || isFetching || isPlaceholderData)
  const isSettled = trimmedQuery.length < 2 || (!isLoading && normalizedQuery === normalizedDebouncedQuery)

  // Query text completions (max 5)
  const querySuggestions: string[] = (data?.querySuggestions || []).slice(0, 5)

  // Map products (max 7). Accept both Typesense-shaped and Mongo-shaped ids.
  const products: SearchSuggestion[] = (data?.products || []).slice(0, 7).map((hit) => {
    const document = hit.document as any
    const productId = document.mongoId || document._id || document.id || document.slug

    return {
      id: `product-${productId}`,
      text: document.name,
      type: 'product' as const,
      slug: document.slug,
      image: document.featuredImage || document.image || '',
      brandName: document.brandName || document.brand?.name || '',
      requiresPrescription: document.requiresPrescription === true,
    }
  })

  // Map brands (max 2)
  const brands: SearchSuggestion[] = (data?.brands || []).slice(0, 2).map((hit) => ({
    id: `brand-${hit.document.mongoId}`,
    text: hit.document.name,
    type: 'brand' as const,
    slug: hit.document.slug,
    image: hit.document.logo || '',
    productCount: hit.document.productCount,
  }))

  // Map categories (max 2)
  const categories: SearchSuggestion[] = (data?.categories || []).slice(0, 2).map((hit) => ({
    id: `category-${hit.document.mongoId}`,
    text: hit.document.name,
    type: 'category' as const,
    slug: hit.document.slug,
    icon: hit.document.icon || '📁',
    productCount: hit.document.productCount,
  }))

  const articles: SearchSuggestion[] = (data?.articles || []).slice(0, 3).map((hit) => ({
    id: `article-${hit.document.mongoId || hit.document._id || hit.document.slug}`,
    text: hit.document.title,
    type: 'article' as const,
    slug: hit.document.slug,
    image: hit.document.featuredImage || '',
    excerpt: hit.document.excerpt || '',
  }))

  // Combined flat list for backward compat
  const all = [...brands, ...categories, ...articles, ...products]

  return {
    products,
    brands,
    categories,
    articles,
    querySuggestions,
    all,
    isLoading,
    isSettled,
  }
}
