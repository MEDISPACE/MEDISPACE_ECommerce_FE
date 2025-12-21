import type { Product, PriceVariant } from '../types/product'

/**
 * Get the default price variant from a product
 * Returns the variant with isDefault=true, or the first variant if none is marked default
 */
export function getDefaultPriceVariant(product: Product): PriceVariant | null {
    if (!product.priceVariants || product.priceVariants.length === 0) {
        return null
    }
    return product.priceVariants.find(v => v.isDefault) || product.priceVariants[0]
}

/**
 * Get the price to display for a product (from default variant)
 * This is used for product cards and listings
 */
export function getProductPrice(product: Product): number {
    const defaultVariant = getDefaultPriceVariant(product)
    if (defaultVariant) {
        return defaultVariant.price
    }
    // Fallback for legacy products
    return (product as any).price ?? (product as any).salePrice ?? 0
}

/**
 * Get the original price (before discount) for a product
 */
export function getProductOriginalPrice(product: Product): number | undefined {
    const defaultVariant = getDefaultPriceVariant(product)
    if (defaultVariant?.originalPrice) {
        return defaultVariant.originalPrice
    }
    // Fallback for legacy products
    return (product as any).originalPrice
}

/**
 * Get the unit name for the default variant
 */
export function getProductUnit(product: Product): string {
    const defaultVariant = getDefaultPriceVariant(product)
    return defaultVariant?.unit || (product as any).unit || 'Sản phẩm'
}

/**
 * Check if product has a discount (originalPrice > price)
 */
export function hasDiscount(product: Product): boolean {
    const defaultVariant = getDefaultPriceVariant(product)
    if (defaultVariant) {
        return !!defaultVariant.originalPrice && defaultVariant.originalPrice > defaultVariant.price
    }
    return false
}

/**
 * Calculate discount percentage
 */
export function getDiscountPercentage(product: Product): number {
    const defaultVariant = getDefaultPriceVariant(product)
    if (defaultVariant?.originalPrice && defaultVariant.originalPrice > defaultVariant.price) {
        return Math.round(((defaultVariant.originalPrice - defaultVariant.price) / defaultVariant.originalPrice) * 100)
    }
    // Fallback
    const price = (product as any).price || (product as any).salePrice
    const original = (product as any).originalPrice
    if (original && price && original > price) {
        return Math.round(((original - price) / original) * 100)
    }
    return 0
}

/**
 * Convert Product to ProductCard props format
 * This provides backward compatibility while using new priceVariants
 */
export function toProductCardProps(product: Product) {
    const defaultVariant = getDefaultPriceVariant(product)

    return {
        id: product._id,
        name: product.name,
        slug: product.slug,
        brand: product.brand?.name || '',
        image: product.featuredImage || (product as any).image || '',
        originalPrice: defaultVariant?.originalPrice || (product as any).originalPrice,
        salePrice: defaultVariant?.price || (product as any).price || (product as any).salePrice || 0,
        rating: product.rating || 0,
        reviewCount: product.reviewCount || 0,
        inStock: product.stockQuantity > 0,
        isPrescription: product.requiresPrescription,
        isOnSale: hasDiscount(product),
        discountPercentage: getDiscountPercentage(product),
        unit: defaultVariant?.unit || (product as any).unit,
        packaging: product.details?.packSize || (product as any).packaging,
        needsConsultation: product.requiresPrescription
    }
}
