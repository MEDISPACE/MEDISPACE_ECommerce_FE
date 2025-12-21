import type { Product, Category, Brand } from './product'

// Product API Request/Response types
export interface GetProductsRequest {
  page?: number
  limit?: number
  search?: string
  category?: string
  brand?: string
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  requiresPrescription?: boolean
  status?: 'active' | 'discontinued' | 'out_of_stock'
  sortBy?: 'name' | 'price' | 'createdAt' | 'stockQuantity'
  sortOrder?: 'asc' | 'desc'
}

export interface GetProductsResponse {
  message: string
  result: {
    products: Product[]
    pagination: {
      page: number
      limit: number
      totalPages: number
      totalProducts: number
      hasNextPage: boolean
      hasPrevPage: boolean
    }
  }
}

export interface GetProductResponse {
  message: string
  result: Product
}

export interface CreateProductRequest {
  name: string
  sku: string
  barcode?: string
  shortDescription: string
  categoryId: string
  brandId?: string
  stockQuantity: number
  maxOrderQuantity: number
  status?: 'active' | 'discontinued' | 'out_of_stock'
  isActive?: boolean
  requiresPrescription?: boolean
  featuredImage?: string
}

export interface UpdateProductRequest {
  name?: string
  sku?: string
  barcode?: string
  shortDescription?: string
  categoryId?: string
  brandId?: string
  stockQuantity?: number
  maxOrderQuantity?: number
  status?: 'active' | 'discontinued' | 'out_of_stock'
  isActive?: boolean
  requiresPrescription?: boolean
  featuredImage?: string
}

// Category API Request/Response types
export interface GetCategoriesRequest {
  page?: number
  limit?: number
  parentId?: string
  level?: number
  includeInactive?: boolean
}

export interface GetCategoriesResponse {
  message: string
  result: {
    categories: Category[]
    pagination: {
      page: number
      limit: number
      totalPages: number
      totalCategories: number
    }
  }
}

export interface GetCategoryResponse {
  message: string
  result: Category
}

export interface CreateCategoryRequest {
  name: string
  description?: string
  parentId?: string
  icon?: string
  thumbnailImage?: string
  sortOrder?: number
  isActive?: boolean
}

export interface UpdateCategoryRequest {
  name?: string
  description?: string
  parentId?: string
  icon?: string
  thumbnailImage?: string
  sortOrder?: number
  isActive?: boolean
}

// Brand API Request/Response types
export interface GetBrandsRequest {
  page?: number
  limit?: number
  search?: string
  country?: string
  includeInactive?: boolean
}

export interface GetBrandsResponse {
  message: string
  result: {
    brands: Brand[]
    pagination: {
      page: number
      limit: number
      totalPages: number
      totalBrands: number
    }
  }
}

export interface GetBrandResponse {
  message: string
  result: Brand
}

export interface CreateBrandRequest {
  name: string
  logo?: string
  description?: string
  website?: string
  country?: string
  isActive?: boolean
}

export interface UpdateBrandRequest {
  name?: string
  logo?: string
  description?: string
  website?: string
  country?: string
  isActive?: boolean
}
