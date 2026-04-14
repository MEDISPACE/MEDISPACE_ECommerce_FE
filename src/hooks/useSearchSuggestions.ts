import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { searchService } from '../services/searchService'
import { categoryService } from '../services/categoryService'
import type { Category } from '../types/product'

export interface SearchSuggestion {
  id: string
  text: string
  type: 'product' | 'category' | 'brand'
  icon?: string
  image?: string
  slug?: string
}

export function useSearchSuggestions(query: string) {
  const [debouncedQuery, setDebouncedQuery] = useState(query)

  // Debounce query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  // ── Typesense suggest (fast, typo-tolerant) ──────────────────────────────
  const { data: productSuggestions = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['ts-suggest', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery.trim()) return []

      const hits = await searchService.suggest(debouncedQuery)

      return hits.map((hit) => ({
        id: `product-${hit.document.mongoId}`,
        text: hit.document.name,
        type: 'product' as const,
        slug: hit.document.slug,
        image: hit.document.featuredImage || '',
      }))
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 30 * 1000, // 30s cache
  })

  // ── Category suggestions (cached client-side) ────────────────────────────
  const { data: allCategories = [] } = useQuery({
    queryKey: ['categories-all'],
    queryFn: () => categoryService.getCategories(),
    staleTime: Infinity,
  })

  const categorySuggestions: SearchSuggestion[] = debouncedQuery.trim()
    ? allCategories
        .filter((category: Category) => category.name.toLowerCase().includes(debouncedQuery.toLowerCase()))
        .slice(0, 3)
        .map((category: Category) => ({
          id: `category-${category._id}`,
          text: category.name,
          type: 'category' as const,
          slug: category.slug,
          icon: '📁',
        }))
    : []

  // Deduplicate by id to prevent React "duplicate key" warnings
  const seen = new Set<string>()
  const suggestions = [...productSuggestions, ...categorySuggestions].filter((s) => {
    if (seen.has(s.id)) return false
    seen.add(s.id)
    return true
  })

  return {
    suggestions,
    isLoading: isLoadingProducts,
  }
}
