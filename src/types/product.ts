// Product related types for MEDISPACE

export interface Product {
  id: string
  slug: string
  name: string
  description: string
  shortDescription?: string
  price: number
  originalPrice?: number
  discount?: number
  images: string[]
  thumbnail: string
  category: string // Changed to string for easier rendering
  brand?: string
  sku: string
  stock: number
  isInStock: boolean
  requiresPrescription: boolean

  // Rating and reviews
  rating?: number
  reviewCount?: number

  // Medical specific
  activeIngredient?: string
  dosage?: string
  form: 'tablet' | 'capsule' | 'syrup' | 'injection' | 'cream' | 'other'
  manufacturer?: string
  contraindications?: string[]
  sideEffects?: string[]
  drugInteractions?: string[]
  ageRestrictions?: AgeGroup[]
  pregnancyCategory?: 'A' | 'B' | 'C' | 'D' | 'X'

  // SEO & metadata
  metaTitle?: string
  metaDescription?: string
  tags?: string[]

  // Timestamps
  createdAt: string
  updatedAt: string
}

export interface ProductCategory {
  id: string
  slug: string
  name: string
  description?: string
  image?: string
  parentId?: string
  children?: ProductCategory[]
  productCount?: number
}

export interface ProductFilter {
  category?: string
  brand?: string
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  requiresPrescription?: boolean
  page?: number
  limit?: number
  sort?: 'name' | 'price' | 'created' | 'popular'
  order?: 'asc' | 'desc'
  search?: string
}

export interface AgeGroup {
  min?: number
  max?: number
  unit: 'years' | 'months'
  description?: string
}

export interface ProductReview {
  id: string
  productId: string
  userId: string
  userName: string
  rating: number
  title?: string
  comment: string
  verified: boolean
  helpful: number
  createdAt: string
}

export interface ProductVariant {
  id: string
  productId: string
  name: string
  value: string
  price?: number
  stock?: number
  sku?: string
}
