import type { Category } from '../types/product'
import { apiClient } from './apiClient'
import { API_ENDPOINTS } from '../constants'

export const categoryService = {
  /**
   * Get all categories
   */
  async getCategories(): Promise<Category[]> {
    const response = await apiClient.get(API_ENDPOINTS.CATEGORIES.BASE)
    return response.data as Category[]
  },

  /**
   * Get category by slug
   */
  async getCategoryBySlug(slug: string): Promise<Category | null> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.CATEGORIES.BY_SLUG(slug))
      return response.data as Category
    } catch (error: unknown) {
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
   * Get top categories (most popular)
   */
  async getTopCategories(limit = 6): Promise<Category[]> {
    const response = await apiClient.get(API_ENDPOINTS.CATEGORIES.BASE, { params: { limit, sort: '-productCount' } })
    return response.data as Category[]
  },
}

export default categoryService
