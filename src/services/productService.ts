/**
 * PRODUCT SERVICE - Handles Real API calls
 *
 * This service fetches data from the backend API.
 */

import type { Product, ProductFilter } from '../types/product'
import { apiClient } from './apiClient'
import { API_ENDPOINTS } from '../constants'

type ProductsResponse =
  | {
      message?: string
      result?: {
        products?: Product[]
        pagination?: {
          page: number
          limit: number
          totalPages: number
          totalCount: number
        }
      }
      products?: Product[]
    }
  | Product[]

export const productService = {
  /**
   * Get all products with optional filtering (DEPRECATED - use getProductsPaginated instead)
   */
  async getProducts(
    filters?: Partial<ProductFilter> & { limit?: number; sortBy?: string; sortOrder?: string },
  ): Promise<Product[]> {
    // Real API call - use backend API endpoints
    const response = await apiClient.get(API_ENDPOINTS.PRODUCTS.BASE, { params: filters })
    if (response && response.data) {
      const data = response.data as ProductsResponse
      if (
        typeof data === 'object' &&
        data !== null &&
        'result' in data &&
        data.result &&
        Array.isArray(data.result.products)
      )
        return data.result.products as Product[]
      if (Array.isArray(data)) return data as Product[]
      if (typeof data === 'object' && data !== null && 'products' in data && Array.isArray(data.products))
        return data.products as Product[]
    }
    return []
  },

  /**
   * Get products with pagination (OPTIMIZED)
   */
  async getProductsPaginated(
    filters?: Partial<ProductFilter> & {
      page?: number
      limit?: number
      sortBy?: string
      sortOrder?: string
      categoryId?: string
    },
  ): Promise<{
    products: Product[]
    pagination: {
      page: number
      limit: number
      totalPages: number
      totalCount: number
    }
  }> {
    const response = await apiClient.get(API_ENDPOINTS.PRODUCTS.BASE, { params: filters })

    if (response && response.data) {
      const data = response.data as ProductsResponse

      // Handle new paginated response format
      if (typeof data === 'object' && data !== null && 'result' in data && data.result) {
        return {
          products: (data.result.products || []) as Product[],
          pagination: data.result.pagination || {
            page: 1,
            limit: 20,
            totalPages: 1,
            totalCount: 0,
          },
        }
      }
    }

    // Fallback
    return {
      products: [],
      pagination: {
        page: 1,
        limit: 20,
        totalPages: 0,
        totalCount: 0,
      },
    }
  },

  /**
   * Get featured products (non-prescription products that can be purchased directly)
   */
  async getFeaturedProducts(limit = 12): Promise<Product[]> {
    // Get non-prescription products (OTC) as featured products
    const response = await apiClient.get(API_ENDPOINTS.PRODUCTS.BASE, {
      params: {
        limit,
        requiresPrescription: 'false',
        isActive: 'true',
      },
    })
    if (response && response.data) {
      const data = response.data as ProductsResponse
      if (
        typeof data === 'object' &&
        data !== null &&
        'result' in data &&
        data.result &&
        Array.isArray(data.result.products)
      )
        return data.result.products as Product[]
      if (Array.isArray(data)) return data as Product[]
      if (typeof data === 'object' && data !== null && 'products' in data && Array.isArray(data.products))
        return data.products as Product[]
    }
    return []
  },

  /**
   * Get product by ID
   */
  async getProductById(id: string): Promise<Product | null> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.PRODUCTS.BY_ID(id))
      if (response && response.data) {
        const data = response.data as unknown
        if (typeof data === 'object' && data !== null && 'result' in data)
          return (data as { result?: unknown }).result as Product
        return data as Product
      }
      return null
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        error.response &&
        typeof error.response === 'object' &&
        'status' in error.response &&
        error.response.status === 404
      ) {
        return null
      }
      throw error
    }
  },

  /**
   * Get product by slug
   */
  async getProductBySlug(slug: string): Promise<Product | null> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.PRODUCTS.BY_SLUG(slug))
      if (response && response.data) {
        const data = response.data as unknown
        if (typeof data === 'object' && data !== null && 'result' in data)
          return (data as { result?: unknown }).result as Product
        return data as Product
      }
      return null
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        error.response &&
        typeof error.response === 'object' &&
        'status' in error.response &&
        error.response.status === 404
      ) {
        return null
      }
      throw error
    }
  },

  /**
   * Search products by query
   */
  async searchProducts(query: string, filters?: Partial<ProductFilter>): Promise<Product[]> {
    const response = await apiClient.get(API_ENDPOINTS.PRODUCTS.BASE, {
      params: { search: query, ...filters },
    })
    if (response && response.data) {
      const data = response.data as ProductsResponse
      if (
        typeof data === 'object' &&
        data !== null &&
        'result' in data &&
        data.result &&
        Array.isArray(data.result.products)
      )
        return data.result.products as Product[]
      if (Array.isArray(data)) return data as Product[]
      if (typeof data === 'object' && data !== null && 'products' in data && Array.isArray(data.products))
        return data.products as Product[]
    }
    return []
  },

  /**
   * Get products by category
   */
  async getProductsByCategory(categorySlug: string): Promise<Product[]> {
    const response = await apiClient.get(API_ENDPOINTS.PRODUCTS.BASE, { params: { category: categorySlug } })
    if (response && response.data) {
      const data = response.data as ProductsResponse
      if (
        typeof data === 'object' &&
        data !== null &&
        'result' in data &&
        data.result &&
        Array.isArray(data.result.products)
      )
        return data.result.products as Product[]
      if (Array.isArray(data)) return data as Product[]
      if (typeof data === 'object' && data !== null && 'products' in data && Array.isArray(data.products))
        return data.products as Product[]
    }
    return []
  },

  /**
   * Get prescription products (require prescription)
   */
  async getPrescriptionProducts(): Promise<Product[]> {
    const response = await apiClient.get(API_ENDPOINTS.PRODUCTS.BASE, { params: { prescription: true } })
    if (response && response.data) {
      const data = response.data as ProductsResponse
      if (
        typeof data === 'object' &&
        data !== null &&
        'result' in data &&
        data.result &&
        Array.isArray(data.result.products)
      )
        return data.result.products as Product[]
      if (Array.isArray(data)) return data as Product[]
      if (typeof data === 'object' && data !== null && 'products' in data && Array.isArray(data.products))
        return data.products as Product[]
    }
    return []
  },

  /**
   * Get related products (same category, different brand, etc.)
   */
  async getRelatedProducts(productId: string, limit = 6): Promise<Product[]> {
    const response = await apiClient.get(`/products/${productId}/related`, { params: { limit } })
    if (response && response.data) {
      const data = response.data as ProductsResponse
      if (
        typeof data === 'object' &&
        data !== null &&
        'result' in data &&
        data.result &&
        Array.isArray(data.result.products)
      )
        return data.result.products as Product[]
      if (Array.isArray(data)) return data as Product[]
      if (typeof data === 'object' && data !== null && 'products' in data && Array.isArray(data.products))
        return data.products as Product[]
    }
    return []
  },

  /**
   * Create a new product (Admin/Pharmacist only)
   */
  async createProduct(data: Partial<Product>): Promise<Product> {
    const response = await apiClient.post(API_ENDPOINTS.PRODUCTS.BASE, data)
    if (response && response.data) {
      const responseData = response.data as unknown
      if (typeof responseData === 'object' && responseData !== null && 'result' in responseData)
        return (responseData as { result?: unknown }).result as Product
      return responseData as Product
    }
    throw new Error('Failed to create product')
  },

  /**
   * Update an existing product (Admin/Pharmacist only)
   */
  async updateProduct(productId: string, data: Partial<Product>): Promise<Product> {
    const response = await apiClient.patch(API_ENDPOINTS.PRODUCTS.BY_ID(productId), data)
    if (response && response.data) {
      const responseData = response.data as unknown
      if (typeof responseData === 'object' && responseData !== null && 'result' in responseData)
        return (responseData as { result?: unknown }).result as Product
      return responseData as Product
    }
    throw new Error('Failed to update product')
  },

  /**
   * Toggle product status (active/inactive)
   */
  async toggleProductStatus(productId: string, isActive: boolean): Promise<Product> {
    const response = await apiClient.patch(`/products/${productId}/toggle-status`, { isActive })
    if (response && response.data) {
      const responseData = response.data as unknown
      if (typeof responseData === 'object' && responseData !== null && 'result' in responseData)
        return (responseData as { result?: unknown }).result as Product
      return responseData as Product
    }
    throw new Error('Failed to toggle product status')
  },

  /**
   * Update product stock quantity
   */
  async updateStock(productId: string, stockQuantity: number): Promise<Product> {
    const response = await apiClient.patch(`/products/${productId}/stock`, { stockQuantity })
    if (response && response.data) {
      const responseData = response.data as unknown
      if (typeof responseData === 'object' && responseData !== null && 'result' in responseData)
        return (responseData as { result?: unknown }).result as Product
      return responseData as Product
    }
    throw new Error('Failed to update stock')
  },

  /**
   * Delete a product (Admin only)
   */
  async deleteProduct(productId: string): Promise<{ message: string }> {
    const response = await apiClient.delete(API_ENDPOINTS.PRODUCTS.BY_ID(productId))
    if (response && response.data) {
      return response.data as { message: string }
    }
    return { message: 'Product deleted successfully' }
  },
}

export default productService
