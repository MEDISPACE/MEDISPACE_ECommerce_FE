import { useState, useMemo } from 'react'
import { mockProducts } from '~/utils/mockData'
import type { Product } from '~/types/product'

interface FilterOptions {
  category?: string
  priceRange?: [number, number]
  rating?: number
  inStock?: boolean
  isPrescription?: boolean
  searchQuery?: string
}

interface UseProductFilterReturn {
  filteredProducts: Product[]
  filters: FilterOptions
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>
  resetFilters: () => void
  totalCount: number
}

/**
 * Hook for filtering and searching products
 * Provides comprehensive filtering capabilities
 */
export const useProductFilter = (initialFilters: FilterOptions = {}): UseProductFilterReturn => {
  const [filters, setFilters] = useState<FilterOptions>(initialFilters)

  const filteredProducts = useMemo(() => {
    let results = [...mockProducts]

    // Category filter
    if (filters.category) {
      results = results.filter((product) => product.category?.toLowerCase().includes(filters.category!.toLowerCase()))
    }

    // Price range filter
    if (filters.priceRange) {
      const [min, max] = filters.priceRange
      results = results.filter((product) => {
        const price = product.salePrice || product.price || 0
        return price >= min && price <= max
      })
    }

    // Rating filter
    if (filters.rating) {
      results = results.filter((product) => (product.rating || 0) >= filters.rating!)
    }

    // Stock filter
    if (filters.inStock !== undefined) {
      results = results.filter((product) => (filters.inStock ? product.inStock : !product.inStock))
    }

    // Prescription filter
    if (filters.isPrescription !== undefined) {
      results = results.filter((product) => product.isPrescription === filters.isPrescription)
    }

    // Search query filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      results = results.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.description?.toLowerCase().includes(query) ||
          product.category?.toLowerCase().includes(query),
      )
    }

    return results
  }, [filters])

  const resetFilters = () => {
    setFilters({})
  }

  return {
    filteredProducts,
    filters,
    setFilters,
    resetFilters,
    totalCount: filteredProducts.length,
  }
}
