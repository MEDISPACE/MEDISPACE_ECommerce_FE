import type { Category } from '../types/product'
import { apiClient } from './apiClient'
import { API_ENDPOINTS } from '../constants'

type CategoriesResponse =
  | {
      message?: string
      result?: {
        categories?: Category[]
        pagination?: unknown
      }
      categories?: Category[]
    }
  | Category[]

export const categoryService = {
  /**
   * Get all categories
   */
  async getCategories(): Promise<Category[]> {
    const response = await apiClient.get(API_ENDPOINTS.CATEGORIES.BASE, { params: { limit: 100 } })
    // Backend returns { message, result } where result contains categories + pagination
    if (response && response.data) {
      const data = response.data as CategoriesResponse
      if (
        typeof data === 'object' &&
        data !== null &&
        'result' in data &&
        data.result &&
        Array.isArray(data.result.categories)
      )
        return data.result.categories as Category[]
      if (Array.isArray(data)) return data as Category[]
      if (typeof data === 'object' && data !== null && 'categories' in data && Array.isArray(data.categories))
        return data.categories as Category[]
    }
    return []
  },

  /**
   * Get category by slug
   */
  async getCategoryBySlug(slug: string): Promise<Category | null> {
    try {
      // The backend exposes category slug on the same /categories/:categoryId route (we support slug there).
      const response = await apiClient.get(`${API_ENDPOINTS.CATEGORIES.BASE}/${slug}`)
      // Normalize shape
      if (response && response.data) {
        const data = response.data as unknown
        if (typeof data === 'object' && data !== null && 'result' in data)
          return (data as { result?: unknown }).result as Category
        return data as Category
      }
      return null
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
   * Get category children (subcategories)
   */
  async getCategoryChildren(categoryId: string): Promise<Category[]> {
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.CATEGORIES.BASE}/${categoryId}/children`)
      if (response && response.data) {
        const data = response.data as unknown
        if (typeof data === 'object' && data !== null && 'result' in data)
          return (data as { result?: unknown }).result as Category[]
        return data as Category[]
      }
      return []
    } catch (error: unknown) {
      return []
    }
  },
}

export default categoryService
