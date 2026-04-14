import type { Product, Category, Brand, PriceVariant } from '../types/product'

/**
 * Helper functions to safely access Product properties with fallbacks
 * These functions handle the transition from backend schema to frontend usage
 */

export const getProductId = (product: Product): string => {
  return product.id || product._id
}

export const getProductDescription = (product: Product): string => {
  return product.description || product.shortDescription
}

export const getProductImage = (product: Product): string => {
  return product.image || product.featuredImage || '/images/placeholder-product.jpg'
}

export const getProductImages = (product: Product): string[] => {
  // First check for media images from productMedia collection
  if (product.media?.images && product.media.images.length > 0) {
    return product.media.images.sort((a, b) => a.sortOrder - b.sortOrder).map((img) => img.url)
  }
  // Fall back to legacy images array
  if (product.images && product.images.length > 0) {
    return product.images
  }
  // Fall back to single main image
  const mainImage = getProductImage(product)
  return [mainImage]
}

export const isProductInStock = (product: Product): boolean => {
  if (product.inStock !== undefined) {
    return product.inStock
  }
  return product.stockQuantity > 0
}

export const isProductPrescription = (product: Product): boolean => {
  if (product.isPrescription !== undefined) {
    return product.isPrescription
  }
  if (product.needsConsultation !== undefined) {
    return product.needsConsultation
  }
  return product.requiresPrescription
}

export const getProductRating = (product: Product): number => {
  return product.rating || 0
}

export const getProductReviewCount = (product: Product): number => {
  return product.reviewCount || 0
}

/**
 * Get the default price variant from a product
 * Returns the variant with isDefault=true, or the first variant if none is marked default
 */
export const getDefaultPriceVariant = (product: Product): PriceVariant | null => {
  if (!product.priceVariants || product.priceVariants.length === 0) {
    return null
  }
  return product.priceVariants.find((v) => v.isDefault) || product.priceVariants[0]
}

/**
 * Get the unit name for the default variant
 */
export const getProductUnit = (product: Product): string => {
  const defaultVariant = getDefaultPriceVariant(product)
  return defaultVariant?.unit || (product as any).unit || 'Sản phẩm'
}

export const getProductPrice = (product: Product): number => {
  // First try priceVariants (new format)
  const defaultVariant = getDefaultPriceVariant(product)
  if (defaultVariant) {
    return defaultVariant.price
  }
  // Fallback to legacy fields
  return (product as any).price || (product as any).salePrice || (product as any).originalPrice || 0
}

export const getProductOriginalPrice = (product: Product): number | undefined => {
  // First try priceVariants (new format)
  const defaultVariant = getDefaultPriceVariant(product)
  if (defaultVariant?.originalPrice) {
    return defaultVariant.originalPrice
  }
  // Fallback to legacy fields
  return (product as any).originalPrice || (product as any).price
}

export const getProductSalePrice = (product: Product): number | undefined => {
  // First try priceVariants (new format) - salePrice = current price
  const defaultVariant = getDefaultPriceVariant(product)
  if (defaultVariant) {
    return defaultVariant.price
  }
  // Fallback to legacy fields
  return (product as any).salePrice || (product as any).price
}

export const isProductOnSale = (product: Product): boolean => {
  if ((product as any).onSale !== undefined) {
    return (product as any).onSale
  }
  if ((product as any).isOnSale !== undefined) {
    return (product as any).isOnSale
  }
  const originalPrice = getProductOriginalPrice(product)
  const salePrice = getProductSalePrice(product)
  return originalPrice !== undefined && salePrice !== undefined && salePrice < originalPrice
}

/**
 * Calculate discount percentage
 */
export const getDiscountPercentage = (product: Product): number => {
  const originalPrice = getProductOriginalPrice(product)
  const salePrice = getProductSalePrice(product)
  if (originalPrice && salePrice && originalPrice > salePrice) {
    return Math.round(((originalPrice - salePrice) / originalPrice) * 100)
  }
  return (product as any).discountPercentage || 0
}

export const getBrandName = (product: Product): string => {
  if (typeof product.brand === 'string') {
    return product.brand
  }
  if (product.brand && typeof product.brand === 'object') {
    return product.brand.name
  }
  return 'Unknown Brand'
}

export const getCategoryName = (product: Product): string => {
  if (typeof product.category === 'string') {
    return product.category
  }
  if (product.category && typeof product.category === 'object') {
    return product.category.name
  }
  return 'Uncategorized'
}

export const getBrandId = (brand: Brand): string => {
  return brand.id || brand._id
}

export const getCategoryId = (category: Category): string => {
  return category.id || category._id
}

export const getCategoryImage = (category: Category): string => {
  return category.image || category.thumbnailImage || '/images/placeholder-category.jpg'
}

/**
 * Transform backend Product to frontend-compatible format
 * This ensures all components get the properties they expect
 */
export const transformProduct = (backendProduct: Product): Product => {
  return {
    ...backendProduct,
    id: getProductId(backendProduct),
    description: getProductDescription(backendProduct),
    image: getProductImage(backendProduct),
    images: getProductImages(backendProduct),
    inStock: isProductInStock(backendProduct),
    isPrescription: isProductPrescription(backendProduct),
    rating: getProductRating(backendProduct),
    reviewCount: getProductReviewCount(backendProduct),
    price: getProductPrice(backendProduct),
    onSale: isProductOnSale(backendProduct),
    isOnSale: isProductOnSale(backendProduct),
  }
}

/**
 * Transform backend Category to frontend-compatible format
 */
export const transformCategory = (backendCategory: Category): Category => {
  return {
    ...backendCategory,
    id: getCategoryId(backendCategory),
    image: getCategoryImage(backendCategory),
  }
}

/**
 * Transform backend Brand to frontend-compatible format
 */
export const transformBrand = (backendBrand: Brand): Brand => {
  return {
    ...backendBrand,
    id: getBrandId(backendBrand),
  }
}

/**
 * Create a legacy-compatible Product for components that still expect old format
 */
export interface LegacyProduct {
  _id: string
  name: string
  slug: string
  sku: string
  barcode?: string
  shortDescription: string
  categoryId: string
  brandId?: string
  stockQuantity: number
  maxOrderQuantity: number
  status: 'active' | 'discontinued' | 'out_of_stock'
  isActive: boolean
  requiresPrescription: boolean
  featuredImage?: string
  createdAt: string
  updatedAt: string
  createdBy: string
  lastModifiedBy?: string
  category?: Category
  brand?: Brand

  // Required legacy properties
  id: string
  description: string
  image: string
  images: string[]
  inStock: boolean
  isPrescription: boolean
  rating: number
  reviewCount: number
  price: number

  // Optional legacy properties
  originalPrice?: number
  salePrice?: number
  discountPercentage?: number
  onSale?: boolean
  isOnSale?: boolean
  needsConsultation?: boolean
  origin?: string
  unit?: string
  packaging?: string
  expiryInfo?: string
  ingredients?: string[]
  uses?: string[]
  instructions?: string
  warnings?: string[]
  tags?: string[]
}

export const createLegacyProduct = (product: Product): LegacyProduct => {
  const base = {
    ...product,
    id: getProductId(product),
    description: getProductDescription(product),
    image: getProductImage(product),
    images: getProductImages(product),
    inStock: isProductInStock(product),
    isPrescription: isProductPrescription(product),
    rating: getProductRating(product),
    reviewCount: getProductReviewCount(product),
    price: getProductPrice(product),
  }

  return base as LegacyProduct
}
