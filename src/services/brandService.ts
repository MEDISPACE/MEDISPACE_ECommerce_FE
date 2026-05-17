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

export interface CreateBrandData {
  name: string
  slug?: string
  logo?: string
  description?: string
  website?: string
  country?: string
  isActive?: boolean
}

export interface UpdateBrandData {
  name?: string
  slug?: string
  logo?: string
  description?: string
  website?: string
  country?: string
  isActive?: boolean
}

export interface GetBrandsParams {
  limit?: number
  page?: number
  search?: string
  isActive?: string
  country?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export const brandService = {
  /**
   * Get all brands with optional filtering/pagination
   */
  async getBrands(params?: GetBrandsParams): Promise<Brand[]> {
    const queryParams = new URLSearchParams()
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.search) queryParams.append('search', params.search)
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive)
    if (params?.country) queryParams.append('country', params.country)
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy)
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder)

    const queryString = queryParams.toString()
    const url = queryString ? `${API_ENDPOINTS.BRANDS.BASE}?${queryString}` : API_ENDPOINTS.BRANDS.BASE

    const response = await apiClient.get(url)
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

  /**
   * Create a new brand (Admin only)
   */
  async createBrand(data: CreateBrandData): Promise<Brand> {
    const response = await apiClient.post(API_ENDPOINTS.BRANDS.BASE, data)
    if (response && response.data) {
      const responseData = response.data as unknown
      if (typeof responseData === 'object' && responseData !== null && 'result' in responseData)
        return (responseData as { result?: unknown }).result as Brand
      return responseData as Brand
    }
    throw new Error('Failed to create brand')
  },

  /**
   * Update an existing brand (Admin only)
   */
  async updateBrand(brandId: string, data: UpdateBrandData): Promise<Brand> {
    const response = await apiClient.patch(API_ENDPOINTS.BRANDS.BY_ID(brandId), data)
    if (response && response.data) {
      const responseData = response.data as unknown
      if (typeof responseData === 'object' && responseData !== null && 'result' in responseData)
        return (responseData as { result?: unknown }).result as Brand
      return responseData as Brand
    }
    throw new Error('Failed to update brand')
  },

  /**
   * Toggle brand status (active/inactive)
   */
  async toggleBrandStatus(brandId: string, isActive: boolean): Promise<Brand> {
    const response = await apiClient.patch(`/brands/${brandId}/toggle-status`, { isActive })
    if (response && response.data) {
      const responseData = response.data as unknown
      if (typeof responseData === 'object' && responseData !== null && 'result' in responseData)
        return (responseData as { result?: unknown }).result as Brand
      return responseData as Brand
    }
    throw new Error('Failed to toggle brand status')
  },

  /**
   * Delete a brand (Admin only)
   */
  async deleteBrand(brandId: string): Promise<{ message: string }> {
    const response = await apiClient.delete(API_ENDPOINTS.BRANDS.BY_ID(brandId))
    if (response && response.data) {
      return response.data as { message: string }
    }
    return { message: 'Brand deleted successfully' }
  },
}

export default brandService
