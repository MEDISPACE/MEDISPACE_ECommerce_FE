/**
 * Custom hook for infinite loading products with React Query
 * Optimized for performance - only loads 20 products per page
 */

import { useInfiniteQuery } from '@tanstack/react-query'
import { productService } from '../services/productService'
import type { Product, ProductFilter } from '../types/product'

interface UseInfiniteProductsParams {
  categoryId?: string
  enabled?: boolean
  search?: string
  filters?: ProductFilter
  sortBy?: string
}

interface ProductsPage {
  products: Product[]
  pagination: {
    page: number
    limit: number
    totalPages: number
    totalCount: number
  }
}

export function useInfiniteProducts({
  categoryId,
  enabled = true,
  search,
  filters,
  sortBy,
}: UseInfiniteProductsParams) {
  return useInfiniteQuery<ProductsPage, Error>({
    queryKey: ['products', 'infinite', categoryId, search, filters, sortBy],
    queryFn: async ({ pageParam = 1 }) => {
      // Build query params for server-side filtering
      const params: Record<string, unknown> = {
        page: pageParam as number,
        limit: 20,
        categoryId,
      }

      // Add search
      if (search) {
        params.search = search
      }

      // Add sorting
      if (sortBy) {
        switch (sortBy) {
          case 'newest':
            params.sortBy = 'createdAt'
            params.sortOrder = 'desc'
            break
          case 'price-asc':
            params.sortBy = 'price'
            params.sortOrder = 'asc'
            break
          case 'price-desc':
            params.sortBy = 'price'
            params.sortOrder = 'desc'
            break
          case 'rating':
            params.sortBy = 'rating'
            params.sortOrder = 'desc'
            break
          case 'bestseller':
            params.sortBy = 'reviewCount'
            params.sortOrder = 'desc'
            break
        }
      }

      // Add filters
      if (filters) {
        if (filters.brands && filters.brands.length > 0) {
          params.brandId = filters.brands[0]
        }
        if (filters.isPrescription !== undefined) {
          params.requiresPrescription = filters.isPrescription
        }
        if (filters.inStock) {
          params.inStock = true
        }
        if (filters.rating && filters.rating > 0) {
          params.ratingMin = filters.rating
        }
        if (filters.priceRange) {
          if (filters.priceRange[0] > 0) {
            params.minPrice = filters.priceRange[0]
          }
          if (filters.priceRange[1] < 10000000) {
            params.maxPrice = filters.priceRange[1]
          }
        }
      }

      const response = await productService.getProductsPaginated(params)
      return response
    },
    getNextPageParam: (lastPage) => {
      // Return next page number if there are more pages
      if (lastPage.pagination.page < lastPage.pagination.totalPages) {
        return lastPage.pagination.page + 1
      }
      return undefined
    },
    initialPageParam: 1,
    enabled,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    placeholderData: (previousData) => previousData,
  })
}
