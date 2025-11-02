// =============================================================================
// MEDISPACE HOOKS INDEX
// Organized by domain for better maintainability and discoverability
// =============================================================================

// Cart & Shopping Domain
export * from './cart'

// UI & Interaction Domain
export * from './ui'

// Navigation & Routing Domain
export * from './navigation'

// Common Utility Domain
export * from './common'

// Product Domain
export * from './product'

// =============================================================================
// DOMAIN-SPECIFIC RE-EXPORTS FOR CONVENIENCE
// =============================================================================

// Most commonly used hooks for quick imports
export { useCart } from './cart'
export { useImageLightbox, useCarousel, useResponsiveGrid } from './ui'
export { useBreadcrumb, useRoleNavigation } from './navigation'
export { useLocalStorage, useMediaQuery } from './common'
export { useProductDetail, useProductFilter, useWishlist, useProductListing } from './product'
