import type { Brand } from '../types/product'
import { apiClient } from './apiClient'
import { API_ENDPOINTS } from '../constants'

type BrandsResponse =
  | {
      message?: string
      result?: {
        brands?: Brand[]
        pagination?: unknown
      }
      brands?: Brand[]
    }
  | Brand[]

export const brandService = {
  /**
   * Get all brands
   */
  async getBrands(): Promise<Brand[]> {
    const response = await apiClient.get(API_ENDPOINTS.BRANDS.BASE)
    if (response && response.data) {
      const data = response.data as BrandsResponse
      if (
        typeof data === 'object' &&
        data !== null &&
        'result' in data &&
        data.result &&
        Array.isArray(data.result.brands)
      )
        return data.result.brands as Brand[]
      if (Array.isArray(data)) return data as Brand[]
      if (typeof data === 'object' && data !== null && 'brands' in data && Array.isArray(data.brands))
        return data.brands as Brand[]
    }
    return []
  },

  /**
   * Get brand by slug
   */
  async getBrandBySlug(slug: string): Promise<Brand | null> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.BRANDS.BY_ID(slug))
      if (response && response.data) {
        const data = response.data as unknown
        if (typeof data === 'object' && data !== null && 'result' in data)
          return (data as { result?: unknown }).result as Brand
        return data as Brand
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
   * Get brand by ID
   */
  async getBrandById(id: string): Promise<Brand | null> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.BRANDS.BY_ID(id))
      if (response && response.data) {
        const data = response.data as unknown
        if (typeof data === 'object' && data !== null && 'result' in data)
          return (data as { result?: unknown }).result as Brand
        return data as Brand
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
}

export default brandService
