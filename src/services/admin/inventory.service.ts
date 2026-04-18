import apiClient from '../apiClient'

// ==================== TYPES ====================

export interface InventoryStats {
  total: number
  active: number
  outOfStock: number
  lowStock: number
  totalValue: number
  lowStockThreshold: number
}

export interface InventoryProduct {
  _id: string
  name: string
  sku: string
  barcode?: string
  featuredImage?: string
  stockQuantity: number
  status: string
  isActive: boolean
  priceVariants: Array<{
    unit: string
    price: number
    originalPrice?: number
    isDefault: boolean
    quantityPerUnit: number
  }>
  category?: { _id: string; name: string }
  brand?: { _id: string; name: string }
  updatedAt: string
}

export interface InventoryProductsResponse {
  products: InventoryProduct[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface InventoryProductsParams {
  page?: number
  limit?: number
  stockFilter?: 'all' | 'inStock' | 'lowStock' | 'outOfStock'
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// ==================== API FUNCTIONS ====================

/**
 * Get inventory statistics
 */
export const getInventoryStats = async (): Promise<InventoryStats> => {
  const response = await apiClient.get<{ result: InventoryStats }>('/admin/inventory/stats')
  return response.data.result
}

/**
 * Get inventory products with pagination and filters
 */
export const getInventoryProducts = async (
  params: InventoryProductsParams,
): Promise<InventoryProductsResponse> => {
  const response = await apiClient.get<{ result: InventoryProductsResponse }>('/admin/inventory/products', { params })
  return response.data.result
}

/**
 * Update product stock quantity
 */
export const updateProductStock = async (
  productId: string,
  stockQuantity: number,
): Promise<InventoryProduct> => {
  const response = await apiClient.patch<{ result: InventoryProduct }>(`/admin/inventory/${productId}/stock`, {
    stockQuantity,
  })
  return response.data.result
}

// Export as default object
const inventoryService = {
  getInventoryStats,
  getInventoryProducts,
  updateProductStock,
}

export default inventoryService
