import type { Brand } from '../types/product'
import { apiClient } from './apiClient'
import { API_ENDPOINTS } from '../constants'

export const brandService = {
  /**
   * Get all brands
   */
  async getBrands(): Promise<Brand[]> {
    const response = await apiClient.get(API_ENDPOINTS.BRANDS.BASE)
    return response.data as Brand[]
  },

  /**
   * Get brand by slug
   */
  async getBrandBySlug(slug: string): Promise<Brand | null> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.BRANDS.BY_SLUG(slug))
      return response.data as Brand
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
   * Get brand by ID
   */
  async getBrandById(id: string): Promise<Brand | null> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.BRANDS.BY_ID(id))
      return response.data as Brand
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
}

export default brandService
