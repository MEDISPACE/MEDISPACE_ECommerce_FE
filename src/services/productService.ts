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
        pagination?: unknown
      }
      products?: Product[]
    }
  | Product[]

export const productService = {
  /**
   * Get all products with optional filtering
   */
  async getProducts(filters?: Partial<ProductFilter> & { limit?: number; sortBy?: string; sortOrder?: string }): Promise<Product[]> {
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
   * Get featured products
   */
  async getFeaturedProducts(limit = 12): Promise<Product[]> {
    // Real API call - get all products and filter featured ones
    const response = await apiClient.get(API_ENDPOINTS.PRODUCTS.BASE, { params: { limit } })
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
      params: { q: query, ...filters },
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
}

export default productService
