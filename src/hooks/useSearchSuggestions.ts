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
  all: SearchSuggestion[]
  isLoading: boolean
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
  const { data, isLoading } = useQuery({
    queryKey: ['ts-suggest-multi', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery.trim() || debouncedQuery.length < 2) {
        return { products: [], brands: [], categories: [], articles: [] }
      }
      const [suggestions, articleResult] = await Promise.all([
        searchService.suggest(debouncedQuery),
        searchService.searchArticles({ q: debouncedQuery, limit: 3 }),
      ])
      return {
        ...suggestions,
        articles: articleResult.hits || [],
      }
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 30 * 1000, // 30s cache
    placeholderData: { products: [], brands: [], categories: [], articles: [] },
  })

  // Map products (max 5)
  const products: SearchSuggestion[] = (data?.products || []).slice(0, 7).map((hit) => ({
    id: `product-${hit.document.mongoId}`,
    text: hit.document.name,
    type: 'product' as const,
    slug: hit.document.slug,
    image: hit.document.featuredImage || '',
    brandName: hit.document.brandName || '',
    requiresPrescription: hit.document.requiresPrescription === true,
  }))

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
    all,
    isLoading,
  }
}
