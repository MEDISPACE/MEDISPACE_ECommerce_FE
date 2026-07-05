import type { Product } from '../types/product'
import { apiClient } from './apiClient'

export interface DrugDatabaseProduct extends Product {
  lastCheckedAt?: string
  dataQuality?: {
    completenessPercent: number
    missingClinicalFields: string[]
    hasStructuredActiveIngredients: boolean
    activeIngredientSource: 'free_text' | 'missing' | string
    clinicalReferenceReady: boolean
  }
}

export interface DrugDatabaseQuery {
  page?: number
  limit?: number
  search?: string
  categoryId?: string
  type?: 'all' | 'Rx' | 'OTC'
  stock?: 'all' | 'inStock' | 'lowStock' | 'outOfStock'
  activeStatus?: 'active' | 'inactive' | 'all'
  status?: 'all' | 'active' | 'discontinued' | 'out_of_stock'
  sortBy?: 'name' | 'stockQuantity' | 'createdAt' | 'updatedAt' | 'price' | 'rating'
  sortOrder?: 'asc' | 'desc'
}

export interface DrugDatabaseResponse {
  products: DrugDatabaseProduct[]
  pagination: {
    page: number
    limit: number
    totalPages: number
    totalCount: number
  }
  lowStockThreshold: number
  searchSource: 'typesense' | 'mongo' | string
  lastCheckedAt: string
}

const normalizeParams = (query: DrugDatabaseQuery) => {
  const params: Record<string, string | number> = {
    page: query.page || 1,
    limit: query.limit || 24,
    sortBy: query.sortBy || 'name',
    sortOrder: query.sortOrder || 'asc',
  }

  if (query.search?.trim()) params.search = query.search.trim()
  if (query.categoryId && query.categoryId !== 'all') params.categoryId = query.categoryId
  if (query.type && query.type !== 'all') params.type = query.type
  if (query.stock && query.stock !== 'all') params.stock = query.stock
  if (query.activeStatus) params.activeStatus = query.activeStatus
  if (query.status && query.status !== 'all') params.status = query.status

  return params
}

export const pharmacistDrugDatabaseService = {
  async getProducts(query: DrugDatabaseQuery): Promise<DrugDatabaseResponse> {
    const response = await apiClient.get<{ result: DrugDatabaseResponse }>('/pharmacist/drug-database/products', {
      params: normalizeParams(query),
    })
    return response.data.result
  },

  async getProduct(productId: string): Promise<DrugDatabaseProduct> {
    const response = await apiClient.get<{ result: DrugDatabaseProduct }>(`/pharmacist/drug-database/products/${productId}`)
    return response.data.result
  },
}

export default pharmacistDrugDatabaseService
