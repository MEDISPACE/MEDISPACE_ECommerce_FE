/**
 * PRODUCT SERVICE - Handles Real API calls
 *
 * This service fetches data from the backend API.
 */

import type { Product, ProductFilter } from '../types/product'
import { apiClient } from './apiClient'
import { API_ENDPOINTS } from '../constants'

export const productService = {
  /**
   * Get all products with optional filtering
   */
  async getProducts(filters?: Partial<ProductFilter>): Promise<Product[]> {
    // Real API call - use backend API endpoints
    const response = await apiClient.get(API_ENDPOINTS.PRODUCTS.BASE, { params: filters })
    return response.data as Product[]
  },

  /**
   * Get featured products
   */
  async getFeaturedProducts(limit = 12): Promise<Product[]> {
    // Real API call - get all products and filter featured ones
    const response = await apiClient.get(API_ENDPOINTS.PRODUCTS.BASE, { params: { limit } })
    return response.data as Product[]
  },

  /**
   * Get product by ID
   */
  async getProductById(id: string): Promise<Product | null> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.PRODUCTS.BY_ID(id))
      return response.data as Product
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
      return response.data as Product
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
    return response.data as Product[]
  },

  /**
   * Get products by category
   */
  async getProductsByCategory(categorySlug: string): Promise<Product[]> {
    const response = await apiClient.get(API_ENDPOINTS.PRODUCTS.BASE, { params: { category: categorySlug } })
    return response.data as Product[]
  },

  /**
   * Get prescription products (require prescription)
   */
  async getPrescriptionProducts(): Promise<Product[]> {
    const response = await apiClient.get(API_ENDPOINTS.PRODUCTS.BASE, { params: { prescription: true } })
    return response.data as Product[]
  },

  /**
   * Get related products (same category, different brand, etc.)
   */
  async getRelatedProducts(productId: string, limit = 6): Promise<Product[]> {
    const response = await apiClient.get(`/products/${productId}/related`, { params: { limit } })
    return response.data as Product[]
  },
}

export default productService
