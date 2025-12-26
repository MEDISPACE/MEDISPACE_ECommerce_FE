import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { productService } from '../services/productService'
import { categoryService } from '../services/categoryService'
import type { Product, Category } from '../types/product'

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

  // Fetch product suggestions from API
  const { data: productSuggestions = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['product-suggestions', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery.trim()) return []

      const products = await productService.getProducts({
        search: debouncedQuery,
        limit: 4, // Only 4 suggestions
      })

      return products.map((product: Product) => ({
        id: `product-${product._id}`,
        text: product.name,
        type: 'product' as const,
        slug: product.slug,
        image: product.featuredImage || product.images?.[0] || '',
      }))
    },
    enabled: debouncedQuery.length >= 2, // Only search if 2+ characters
    staleTime: 5 * 60 * 1000, // Cache 5 minutes
  })

  // Fetch category suggestions (cached permanently)
  const { data: allCategories = [] } = useQuery({
    queryKey: ['categories-all'],
    queryFn: () => categoryService.getCategories(),
    staleTime: Infinity, // Never refetch - categories rarely change
  })

  // Filter categories client-side (fast with small dataset)
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

  // Combine all suggestions
  const suggestions = [...productSuggestions, ...categorySuggestions]

  return {
    suggestions,
    isLoading: isLoadingProducts,
  }
}
