/**
 * Custom hook for infinite loading products with React Query
 * Optimized for performance - only loads 20 products per page
 */

import { useInfiniteQuery } from '@tanstack/react-query'
import { productService } from '../services/productService'
import type { Product } from '../types/product'

interface UseInfiniteProductsParams {
  categoryId?: string
  enabled?: boolean
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

export function useInfiniteProducts({ categoryId, enabled = true }: UseInfiniteProductsParams) {
  return useInfiniteQuery<ProductsPage, Error>({
    queryKey: ['products', 'infinite', categoryId],
    queryFn: async ({ pageParam = 1 }) => {
      // Fetch with pagination - 20 items per page
      const response = await productService.getProductsPaginated({
        categoryId,
        page: pageParam as number,
        limit: 20,
      })
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
  })
}
